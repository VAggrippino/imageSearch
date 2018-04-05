require('dotenv').config()
let express = require('express')
let MongoClient = require('mongodb').MongoClient

let app = express()
app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('index')
})
