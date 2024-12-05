import express from 'express'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'

const app = express()
const PORT = 3000

app.use(bodyParser.json())

// SSRF: Benutzer kann beliebige URLs angeben
app.post('/proxy', (req, res) => {
  const url = req.body.url
  fetch(url)
    .then((response) => response.text())
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send(err.message))
})

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`)
})
