console.log('May Node be with you')

const express = require('express')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient
const app = express()

var db

MongoClient.connect('mongodb://localhost:27017/greenBottle', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

app.use(bodyParser.urlencoded({extended: true}))
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

app.post('/quotes', function(req,res){
  db.collection('quotes').save(req.body, (err, result) => {
    if (err) return console.log(err)

    console.log('saved to database')
    res.redirect('/')
  })
})
//told you haha
