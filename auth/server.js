import express from 'express'
import bodyParser from 'body-parser'
import { exec } from 'child_process'
import jwt from 'jsonwebtoken'

import knex from 'knex'
import { config } from './knexfile.js'
const db = knex(config)

const app = express()
const PORT = 4000
app.use(bodyParser.json())

// HARDCODED SECRET KEY
const SECRET_KEY = 'secret-key'

// Erzeuge ein JWT-Token
app.post('/generate-jwt', (req, res) => {
  const { username } = req.body

  // Token mit dem hardcodierten Secret generieren und 1 Jahr gültig machen
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '365d' })

  console.log(`Generated JWT for ${username}: ${token}`)
  res.status(200).send({ token })
})

// Verifiziere das JWT-Token
app.post('/verify-jwt', (req, res) => {
  const { token } = req.body

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    res.status(200).send({ message: 'Token is valid', decoded })
  } catch (err) {
    res.status(401).send({ message: 'Token is invalid' })
  }
})

app.post('/register', (req, res) => {
  const { username, password } = req.body

  // Unsicheres Passwort-Hashing mit MD5
  const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
  console.log(`Register attempt: ${username}, Hashed Password: ${hashedPassword}`)

  res.status(200).send('Register successful')
})

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
                 WHERE id = '${userId}'`
  console.log(`Executing query: ${query}`)
  res.status(200).send(`User info for ID: ${userId}`)
})

// Session-Token mit unsicheren Zufallszahlen
app.get('/token', (req, res) => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  console.log(`Generated insecure token: ${token}`)
  res.status(200).send({ token })
})

// Endpoint: Command Injection Schwachstelle (?path=/etc; whoami")
app.get('/files', (req, res) => {
  const { path } = req.query

  // Unsichere Verwendung von Benutzereingaben in exec()
  exec('ls ' + path, (error, stdout, _stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`)
      // Stack-Trace zurück senden
      return res.status(500).send(`Error: ${error.stack}`)
    }

    console.log(`Command output: ${stdout}`)
    res.status(200).send(`Files:\n${stdout}`)
  })
})

app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`)
})
