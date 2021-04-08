require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

var mongoose = require('mongoose');
const { exception } = require('console');

const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

let Url = mongoose.model('Url', urlSchema);

const createAndSaveUrl = (url, done) => {
  Url.count({}, function(err, count){
    let urlObj = Url({original_url:  url, short_url: count});
    urlObj.save(function(err, data){
      if (err) return console.error(err);
      done(null , data);
    });
  });
};

const findShortUrl = (url, done) => {
  Url.find({short_url: parseInt(url)}, function(err, val){
    if (err) return console.error(err);
    done(null , val);
  });
};

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:url', function(req, res) {
  findShortUrl(req.params.url,(err, data)=>{
    if(err) { res.json({"error": 'invalid url'}); return; }
    res.redirect(data[0].original_url);
  });
});

app.post('/api/shorturl/new',function(req, res, next) {
    try{
      var n = req.body.url.startsWith("http://") || req.body.url.startsWith("https://");
      if(n === false) throw 'invalid url';

      let urlvar = new URL(req.body.url);

      next();      
    } catch(err){
      res.json({error: 'Invalid URL'});
    }
  }, function(req, res) {
    createAndSaveUrl(req.body.url, (err, data) => {
      res.send({original_url : data.original_url, short_url : data.short_url});
    });
  });

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
