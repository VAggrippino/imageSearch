require('dotenv').config()
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const GoogleImages = require('google-images')

const port = process.env.PORT || 3000
const gimg = new GoogleImages(process.env.CSE_ID, process.env.API_KEY)

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
