console.log('May Node be with you')

const express = require('express')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient
const app = express()

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

app.get('/UI/core.js', (req, res) => {
  console.log("requested core.js")
  res.sendFile(__dirname + '/UI/core.js')
})


app.get('/api/quotes',function(req,res){
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err)
    else return res.json(result)
  });

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
      res.send("Created "+JSON.stringify(result));
  	})
  
})
//told you haha
