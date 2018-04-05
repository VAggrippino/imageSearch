require('dotenv').config()
const express = require('express')
const https = require('https')
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
  pass: process.env.DB_PASS,
}
database['url'] = `mongodb://${database.host}:${database.port}/${database.name}`

// Create a collection to store the searches
createCollection(database)

// Set up the express app
const app = express()
app.set('view engine', 'pug')
app.use(express.static('public')) // For static CSS / JavaScript files

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/api/imagesearch/:query', (req, res) => {
  let query = req.params.query

  insertSearch(database, query)

  let cseParams = '' +
    `?q=${query}` +
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

  console.log(`Search Query: ${query}`)
  let cseRequest = https.request(options, cseResponse => {
    let jsonString = ''
    let searchResults = []
    cseResponse.on('data', data => {
      jsonString += data
    })
    cseResponse.on('end', () => {
      let cseResult = JSON.parse(jsonString)
      let items = cseResult.items
      items.map(item => {
        let resultItem = {
          url: item.link,
          snippet: item.title,
          thumbnail: item.image.thumbnailLink,
          context: item.image.contextLink
        }
        searchResults.push(resultItem)
      })
      res.end(JSON.stringify(searchResults))
    })
  })

  cseRequest.on('error', e => {
    console.log(e)
  })

  cseRequest.end()
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
    collection.insertOne({query})
  } else {
    console.log(`Not inserting record for repeated search: ${query}`)
  }
}

async function getSearches (database) {
  let client = await dbClient(database)
  let db = client.db(database.name)
  let collection = db.collection(database.collection)

  let results = await collection.find({}, {projection: {_id: 0}})
  return results
}
