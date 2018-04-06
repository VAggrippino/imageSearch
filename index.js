require('dotenv').config()
const express = require('express')
const https = require('https')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

// App will listen on this port number
const port = process.env.PORT || 3000

// Database connection information from .env file
const database = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  name: process.env.DB_NAME,
  collection: process.env.DB_COLLECTION,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS
}
database['url'] = `mongodb://${database.host}:${database.port}/${database.name}`

// Create a collection to store the searches
createCollection(database)

// Set up the express app
const app = express()
app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public')) // For static CSS / JavaScript files

app.get('/', (req, res) => {
  getSearches(database)
    .then(result => {
      res.render('index', {
        domain: req.headers.host,
        history: result
      })
    })
})

app.get('/api/imagesearch/:query', newQuery)
app.post('/api/imagesearch', newQuery)

app.get('/api/latest/imagesearch', (req, res) => {
  getSearches(database)
    .then(result => {
      console.log(result)
      res.end(JSON.stringify(result))
    })
})

app.listen(port, () => {
  console.log(`Listening on port ${port} ...`)
})

async function dbClient (database) {
  return MongoClient.connect(database.url)
}

async function createCollection (database) {
  console.log(`Creating collection: ${database.collection}`)
  let client = await dbClient(database)
  let db = client.db(database.name)
  let collection = await db.createCollection(database.collection)
  client.close()
  return collection
}

async function insertSearch (database, query) {
  let client = await dbClient(database)
  let db = client.db(database.name)
  let collection = db.collection(database.collection)

  let lastInserted = await collection.findOne({}, {sort: {_id: -1}})
  if (lastInserted === null || lastInserted.query !== query) {
    console.log(`Inserting record for new search: ${query}`)
    collection.insertOne({term: query})
  } else {
    console.log(`Not inserting record for repeated search: ${query}`)
  }
}

async function getSearches (database) {
  let client = await dbClient(database)
  let db = client.db(database.name)
  let collection = db.collection(database.collection)

  let results = await collection.find({}).sort({_id: -1}).limit(10).toArray()
  results.map(result => {
    let timestamp = result._id.toString().substring(0, 8)
    let date = new Date(parseInt(timestamp, 16) * 1000)
    result.when = date.toISOString()
    delete result._id
  })
  return results
}

function newQuery (req, res) {
  let query = req.body.query || req.params.query
  console.log(`Search Query: ${query}`)

  insertSearch(database, query)

  cseSearch(req)
    .then(searchResults => {
      let jsonString = JSON.stringify(searchResults)

      res.status(200)
      res.set('Content-Type', 'application/json')

      res.end(jsonString)
    })
}

function cseSearch (req) {
  let cseParams = '' +
    `?q=${req.body.query || req.params.query}` +
    `&cx=${process.env.CSE_ID}` +
    `&key=${process.env.API_KEY}` +
    '&num=10' +
    '&safe=high' +
    '&searchType=image' +
    `&start=${req.query.offset || 1}`

  let options = {
    hostname: 'www.googleapis.com',
    path: '/customsearch/v1' + encodeURI(cseParams)
  }

  return new Promise((resolve, reject) => {
    let cseRequest = https.request(options, cseResponse => {
      let jsonString = ''
      let searchResults = []

      cseResponse.on('data', data => {
        jsonString += data
      })

      cseResponse.on('end', () => {
        let cseResult = JSON.parse(jsonString)
        cseResult.items.map(item => {
          let resultItem = {
            url: item.link,
            snippet: item.title,
            thumbnail: item.image.thumbnailLink,
            context: item.image.contextLink
          }
          searchResults.push(resultItem)
        })

        resolve(searchResults)
      })
    })

    cseRequest.on('error', e => {
      console.log('CSE Error:')
      console.log(e)
      reject(e)
    })

    cseRequest.end()
  })
}
