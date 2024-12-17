import express from 'express'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import path from 'path'

const app = express()
const PORT = 3000

app.use(bodyParser.json())

app.get('/', (req, res) => {
  console.log('connection accepted')
  res.sendFile(path.resolve('./src/index.html'))
})

app.get('/send-user-data', async (req, res) => {
  // Userdaten über HTTP senden
  await fetch('http://auth:4000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' }),
  })
})

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
