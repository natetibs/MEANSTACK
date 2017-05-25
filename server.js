console.log('May Node be with you')

const express = require('express')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient
const squatty = require('./squatty.js')
const app = express()
app.use(express.static('UI'))
var mongoose = require('mongoose');

var MONGO_DB;
var DOCKER_DB = process.env.DB_PORT;
if ( DOCKER_DB ) {
  MONGO_DB = DOCKER_DB.replace( 'tcp', 'mongodb' ) + '/squat'
} else {
  MONGO_DB = process.env.MONGODB;
}
var retry = 0;
//mongoose.connect(MONGO_DB)


var db
//Deprecated - before we used Docker-Compose
console.log("mongodb address: " + MONGO_DB)
MongoClient.connect(MONGO_DB, (err, database) => {
  if (err) return console.log(err)
    db = database

  app.listen(process.env.PORT || 3000)
})

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(express.static(__dirname + '/UI'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/UI/index.html')
  console.log("req index")
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
  // Mine was '/Users/zellwk/Projects/demo-repos/crud-express-mongo' for this app.
})

app.get('/api/quotes',function(req,res){
  return getQuotes(res) //return res.json(getQuote())
});

app.post('/api/quotes', function(req,res){

	console.log('name: ' + JSON.stringify(req.body.name));
  console.log('quo: ' + JSON.stringify(req.body.quote));
	//res.send(req.body);
	console.log('hello')
  // Get our form values. These rely on the "name" attributes

  db.collection('quotes').save(req.body, (err, result) => {
   if (err) return console.log(err)

     console.log('saved to database 0')
    	//res.redirect('/')
      squatty.callSquatty(req.body.name,req.body.quote, (name,response) => {

        db.collection('quotes').save({name: name, quote: response}, (err, result) => {
          if (err) return console.log(err)
            console.log("response: " + response);

          console.log('saved to database')
          return getQuotes(res);
      //res.redirect('/')
        })
      })
  })
})

function getQuotes(res){
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err)
      else return res.json(result)
    });
};
//told you haha
