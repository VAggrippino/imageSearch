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

app.get('/api/imagesearch/:query', (req, res) => {
  console.log(`Search Query: ${req.params.query}`)
  res.end('JSON response here')
})

app.listen(port, () => {
  console.log(`Listening on port ${port} ...`)
})
