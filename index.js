require('dotenv').config()
const express = require('express')
const MongoClient = require('mongodb').MongoClient

const port = process.env.PORT || 3000

const app = express()
app.set('view engine', 'pug')
app.use(express.static('public')) // For static CSS / JavaScript files

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/api/imagesearch/:query', (req, res) => {
  console.log(`Search Query: ${req.params.query}`)
  res.end('JSON response here')
})

app.listen(port, () => {
  console.log(`Listening on port ${port} ...`)
})
