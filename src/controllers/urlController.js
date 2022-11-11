const mongoose = require('mongoose');  
const validUrl = require('valid-url')
const shortid = require('shortid');
const redis = require('redis');
const {promisify} = require('util')
const urlModel = require('../models/urlModel');



/*------------------------------------------------------------redis configuration-----------------------------------------------------*/
//Connect to redis: 1. connect to the server 
    const redisClient = redis.createClient(
        12093,
        "redis-12093.c301.ap-south-1-1.ec2.cloud.redislabs.com",
        { no_ready_check: true }
      );
      redisClient.auth("tnHsJoayAhmHj2Q2vidEpfOXAD3IWkWG", function (err) {
        if (err) return  console.log(err);
      });
      redisClient.on("connect", async function () {
        console.log("Connected to Redis..");
      });
    
//2. use the commands :
      const SET_ASYNC = promisify(redisClient.SET).bind(redisClient); //it binds client and promisify.
      const GET_ASYNC = promisify(redisClient.GET).bind(redisClient); 


/*------------------------------------------------------------Handler function of API-1-----------------------------------------------------*/
const createShortUrl = async function(req, res){
    try {
        let {longUrl } = req.body;

        const cachedData = await GET_ASYNC(`${longUrl}`);
        if(cachedData) {console.log("res by cache hit");
          return res.status(200).send({status:true, data: JSON.parse(cachedData)});    
        }
     
        const urlDoc = await urlModel.findOne({longUrl:longUrl}).select({_id:0, __v:0}); //for same response each time
        if(urlDoc) {console.log("oops! cache miss, res by findOne()");
          res.status(200).send({status:true, data: urlDoc});
          const present = new Date(); //in millisec
          const eod = new Date().setHours(23,59,59,999); //millisec
          return await redisClient.set(`${longUrl}`, JSON.stringify(urlDoc), 'EX', parseInt((eod-present)/1000), (err,result)=>{   
            if(err) console.log(err)  //here time is in sec + in integer
            else console.log("key set with an expiry time of : ", new Date(eod).toLocaleString())
          });  
        }   

        const data = {longUrl:longUrl};
        data.urlCode = shortid.generate().toLowerCase();
        data.shortUrl = "localhost:3000/"+ data.urlCode;
    
        const savedData = await urlModel.create(data);
        delete savedData._doc._id; delete savedData._doc.__v;
        res.status(201).send({status:true, data:savedData})

        const expiry = 300;
        return  redisClient.setex(`${longUrl}`, expiry, JSON.stringify(savedData), function(err, result){
          if(err) console.log(err)
          else console.log(`key is set but will expire after ${expiry} seconds`)
        })
   
    } catch (error) {
        console.log(error);
        return res.status(500).send({status:false, message:error.message})
    }
}


/*------------------------------------------------------------Handler function of API-2-----------------------------------------------------*/
const urlRedirect = async function(req, res){
    try {
        const urlCodeValue = req.params.urlCode;
        if(!urlCodeValue) return res.status(400).send({status:false, message:"enter urlCode at the end of url"});
        if(!shortid.isValid(urlCodeValue)) return res.status(400).send({status:false, message:"invalid format of the urlCode, i.e. it must be of length>5 & comprised of only[a-zA-Z0-9_-]"});
        
        const cachedData = await GET_ASYNC(`${urlCodeValue}`);
        if(cachedData) { console.log("res by cache hit");
          return res.status(302).redirect(cachedData);
        }else{
          const doc = await urlModel.findOne({urlCode: urlCodeValue});
          if(!doc) return res.status(404).send({status:false, message:"urlCode not found"});
          res.status(302).redirect(doc.longUrl);
          return await SET_ASYNC(`${urlCodeValue}`, doc.longUrl)    //here not stringifying the value, because it is already in string type
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send({status:false, message:error.message}) 
    }

} 


/*------------------------------------------------------------Handler function of API-3-----------------------------------------------------*/
const flushw = (req, res) => {
    redisClient.flushall("ASYNC", (err, data) => {
      if (err)
        console.log(err)
      else if (data)
        console.log("Memory flushed: ", data)
    })
    res.status(200).send({ msg: "redis memery cleared" })
}

module.exports = {createShortUrl, urlRedirect, flushw}

