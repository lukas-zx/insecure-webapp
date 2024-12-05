import express from 'express'
import bodyParser from 'body-parser'
import * as crypto from 'node:crypto'

const app = express()
const PORT = 4000

app.use(bodyParser.json())

// Auth-Endpoint mit MD5-Schwachstelle
app.post('/login', (req, res) => {
  const { username, password } = req.body

  // Unsicheres Passwort-Hashing mit MD5
  const hashedPassword = crypto.createHash('md5').update(password).digest('hex')

  console.log(`Login attempt: ${username}, Hashed Password: ${hashedPassword}`)

  // Dummy-Response
  res.status(200).send('Login successful')
})

// SQL-Injection Endpoint
app.get('/user', (req, res) => {
  const userId = req.query.id
  const query = `SELECT *
                 FROM users
                 WHERE id = '${userId}'` // SQL Injection möglich
  console.log(`Executing query: ${query}`)
  res.status(200).send(`User info for ID: ${userId}`)
})

app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`)
})
