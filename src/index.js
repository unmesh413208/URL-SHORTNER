const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const app = express();

app.use(bodyParser.json()); //or app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/', route);

const string = "mongodb+srv://ibrahimDatabase1:8Nh3Y1Pj0ck4ubUC@cluster0.otjog5i.mongodb.net/group62Database?retryWrites=true&w=majority";  //storitinevn
mongoose.connect(string,{useNewUrlParser: true}).then(()=> console.log("mongoDB is connected")).catch((err)=> console.log(err));

app.listen(process.env.PORT || 3000, function(){return console.log("Express is running on port "+(process.env.PORT || 3000))});