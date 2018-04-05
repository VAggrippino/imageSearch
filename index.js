require('dotenv').config()
const express = require('express')
const https = require('https')
const MongoClient = require('mongodb').MongoClient

const port = process.env.PORT || 3000

const app = express()
app.set('view engine', 'pug')
app.use(express.static('public')) // For static CSS / JavaScript files

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/api/imagesearch/:query', (req, res) => {
  let query = req.params.query

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
      // res.end(jsonString)
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
