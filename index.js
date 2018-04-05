require('dotenv').config()
let express = require('express')
let MongoClient = require('mongodb').MongoClient

let port = process.env.PORT || 3000

let app = express()
app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('index')
})

app.listen(port, () => {
  console.log(`Listening on port ${port} ...`)
})