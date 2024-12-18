import express from 'express'
import bodyParser from 'body-parser'
import { exec } from 'child_process'
import jwt from 'jsonwebtoken'
import * as crypto from 'node:crypto'
import cors from 'cors'

import knex from 'knex'
import { config } from './knexfile.js'

const db = knex(config)

const app = express()
const PORT = 4000
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(bodyParser.json())
app.use(cors())

// HARDCODED SECRET KEY
const SECRET_KEY = 'secret-key'

// Verifiziere das JWT-Token
app.post('/verify', (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({
    success: false,
    message: 'no token provided',
  })

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    res.status(200).send({
      success: true,
      message: 'Token is valid',
      user: decoded,
    })
  } catch (err) {
    res.status(401).send({
      success: false,
      message: 'Auth error',
    })
  }
})

// Auth-Endpoint mit MD5-Schwachstelle
app.post('/register', async (req, res) => {
  const { email, username, password } = req.body
  try {
    // Unsicheres Passwort-Hashing mit MD5, außerdem kein salt
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
    const userId = await db.table('users').insert({ email, username, password: hashedPassword }).returning('id')
    res.status(201).json({ success: true, message: userId })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: error.stack, // information disclosure
    })
  }
})

// Auth-Endpoint mit SQLI-Schwachstelle
app.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const query = `SELECT *
                   FROM users
                   WHERE email = '${email}'`
    const result = await db.raw(query)
    if (result.rows.length === 0) return res.status(401).send({
      success: false,
      message: 'Invalid email or password',
    })

    const user = result.rows[0]
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
    if (hashedPassword !== user.password) return res.status(401).send({
      success: false,
      message: 'Invalid email or password',
    })

    // Token mit dem hardcodierten Secret generieren und 1 Jahr gültig machen
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '365d' })
    res.status(200).send({ success: true, token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.stack }) // stack ausgeben
  }
})

// get route ohne auth, userdaten werden außerdem unverschlüsselt (HTTP) versendet
app.get('/users', async (req, res) => {
  try {
    const users = await db.table('users').select('*')
    res.status(200).send({ success: true, users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'error fetching users' })
  }
})

// delete route ohne auth
app.post('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id
    const success = await db.table('users').where('id', id).del()
    if (success) {
      console.log(`User with ID ${id} deleted successfully.`)
      return res.status(200).send({ success: true })
    } else {
      console.log(`No user found with ID ${id}`)
      return res.status(404).send({ success: false, message: 'User not found' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'error deleting user', error: error })
  }
})

// TODO: irgendwo anders implementieren
// Session-Token mit unsicheren Zufallszahlen
app.get('/token', (req, res) => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  console.log(`Generated insecure token: ${token}`)
  res.status(200).send({ token })
})

// TODO: in admin page integrieren
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
