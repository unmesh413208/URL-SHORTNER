function isUrl(x){
    const regEx = /^\s*http[s]?:\/\/([a-z]{2,3}\.)?[a-zA-Z0-9]+\.[a-z]{2,3}(\.[a-z]{2})?(\/[\w\-!:@#$%^&*()+=?\.]*)*\s*$/;
    return regEx.test(x)
}


/*------------------------------------------------------------Middleware-1 for API-1-----------------------------------------------------*/
const validateUrl = async function(req, res, next){
    try {
        let {longUrl } = req.body;
         
        if(Object.keys(req.body).length === 0) return res.status(400).send({status:false, message:"no data received, empty body can't be processed"});

        if(!longUrl) return res.status(400).send({status:false, message:"please enter the URL value in longUrl key"});
        longUrl = longUrl.trim();
        
        if(!isUrl(longUrl)) return res.status(400).send({status:false, message:"enter a valid URL"}); //validating with regEx

        req.body.longUrl = longUrl;
        next();
         
    } catch (error) {
        console.log(error);
        return res.status(500).send({status:false, message:error.message})
    }
}


module.exports.validateUrl = validateUrl;