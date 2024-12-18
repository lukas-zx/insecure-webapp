import express from 'express'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import path from 'path'
import cookieParser from 'cookie-parser'

const app = express()
const PORT = 3000
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(bodyParser.json())
app.use(cookieParser())

const auth_service_url = 'http://auth:4000'

async function verifyToken(req, res, next) {
  const token = req.cookies?.token
  if (!token) return res.redirect('/login')

  try {
    const response = await fetch(`${auth_service_url}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()
    if (data.success) {
      req.user = data.user
      return next()
    }
  } catch (error) {
    console.error('Token verification error', error)
  }

  res.redirect('/login')
}

app.get('/', verifyToken, (req, res) => {
  res.sendFile(path.resolve('./src/index.html'))
})

app.get('/register', (req, res) => {
  res.sendFile(path.resolve('./src/register.html'))
})

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body
  try {
    const response = await fetch(`${auth_service_url}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })

    const data = await response.json()
    if (data.success) return res.redirect('/login')
  } catch (error) {
    console.error('Registrierungsfehler', error)
  }

  res.send('<h1>register failed</h1>')
})

app.get('/login', (req, res) => {
  res.sendFile(path.resolve('./src/login.html'))
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const response = await fetch(`${auth_service_url}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (data.success) {
      res.cookie('token', data.token, { maxAge: 365 * 24 * 60 * 60 * 1000 }) // 1 Jahr gültig
      console.log('login success, redirecting to home')
      return res.redirect('/')
    }
  } catch (error) {
    console.error('login error', error)
  }

  res.send('<h1>login failed.</h1>')
})

app.get('/logout', (req, res) => {
  res.clearCookie('token')
  res.redirect('/login')
})

app.get('/admin-panel', (req, res) => {
  res.sendFile(path.resolve('./src/admin-panel.html'))
})

app.get('/ssrf', (req, res) => {
  res.send(`
    <iframe src="about:blank" onload="alert('beliebiges JS ausgeführt 😈')"></iframe>
  `)
})

// SSRF: Benutzer kann beliebige URLs angeben
app.post('/proxy', async (req, res) => {
  const url = req.body.url
  try {
    const result = await fetch(url)
    const data = await result.text()
    res.send(data)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`)
})
