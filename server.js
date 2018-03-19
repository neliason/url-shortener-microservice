'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
var cors = require('cors');

require('dotenv').load();
var app = express();
var port = process.env.PORT || 3000;

var dbConnection = mongoose.connect(process.env.MONGO_URI, {useMongoClient: true});
autoIncrement.initialize(dbConnection)
const Schema = mongoose.Schema;
const shortUrlSchema = new Schema({
  url: {type: String, required: true, unique: true}
});

shortUrlSchema.plugin(autoIncrement.plugin, 'Url');
const Url = mongoose.model('Url', shortUrlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', (req, res, next) => {
  const inputUrl = req.body.url;
  if(!validUrl.isUri(inputUrl)) {
    res.json({error: 'invalid url'});
    return;
  }
  Url.find({url: inputUrl}, (err, dbUrl) => {
    if(err) return new Error(err);
    if(dbUrl.length === 0) {
      let newUrl = new Url({
        url: inputUrl
      });
      newUrl.save((err, data) => {
        if(err) return new Error(err);
        res.json({
          original_url: inputUrl,
          short_url: data._id
        });
      });
    } else {
      res.json({
        original_url: dbUrl[0].url,
        short_url: dbUrl[0]._id
      });
    }
  })

});

app.get('/api/shorturl/:urlId', (req, res) => {
  Url.findById(req.params.urlId, (err, dbUrl) => {
    if(err) return new Error(err);
    res.redirect(dbUrl.url);
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});