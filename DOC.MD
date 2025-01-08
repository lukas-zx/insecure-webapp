# A01: Broken Access Control

- Löschfunktion ist öffentlich Zugänglich, ohne Zugriffskontrolle (Auth-Service)
    ```js
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
    ```

- CORS Kontrolle (Auth-Service)
    ```js
    app.use(cors())
    ```

- Admin-Panel ist ohne Auth zugänglich (Frontend)
    ```js
   app.get('/admin-panel', (req, res) => {
      res.sendFile(path.resolve('./src/admin-panel.html'))
   })
   ```
   
# A02: Cryptographic Failures

- Passwort-Hashing mit MD5 und ohne salt (Auth-Service)
    ```js
   app.post('/register', async (req, res) => {
      const { email, username, password } = req.body
      try {
         const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
         const userId = await db.table('users').insert({ email, username, password: hashedPassword }).returning('id')
         res.status(201).json({ success: true, message: userId })
      } catch (error) {
         console.error(error)
         res.status(500).json({
            success: false,
            message: error.stack,
         })
      }
   })
   ```
   
- JWT secret ist hardcoded (Auth-Service)
   ```js
   const SECRET_KEY = 'secret-key'
   ```
   
- Services kommunizieren per HTTP
   ```js
   const auth_service_url = 'http://auth:4000'
   ```


- Datenbank ist nicht verschlüsselt (terraform)
   ```tf
   resource "docker_container" "db" {
     image = docker_image.db.name
     name  = "db"
     networks_advanced {
       name = docker_network.insecure_network.name
     }
     ports {
       internal = 5432
       external = 5432
     }

     env = [
       "POSTGRES_USER=admin",
       "POSTGRES_PASSWORD=admin",
       "POSTGRES_DB=insecure-db"
     ]
   }
   ```
   
# A03: Injection

- SQL Injection bei login möglich (Auth-Service)
   ```js
   app.post('/login', async (req, res) => {
      const { email, password } = req.body
      try {
         const query = `SELECT * FROM users WHERE email = '${email}'`
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

         const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '365d' })
         res.status(200).send({ success: true, token })
      } catch (error) {
         console.error(error)
         res.status(500).json({ success: false, message: error.stack }) // stack ausgeben
      }
   })
   ```

# A04: Insecure Design

- TODO

# A05: Security Misconfiguration

- Keine SSL Verbindung zur Datenbank (knexfile)
   ```js
   export const config = {
      client: 'pg',
      debug: false,
      connection: {
         host: 'db',
         port: 5432,
         database: 'postgres',
         user: 'admin',
         password: 'admin',
         ssl: false
      },
   }
   ```
  
- x-powered-by HTTP Header ist nicht disabled

- in /register wird Stack-Trace ausgegeben (Auth-Service)
   ```js
   app.post('/register', async (req, res) => {
      const { email, username, password } = req.body
      try {
         const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
         const userId = await db.table('users').insert({ email, username, password: hashedPassword }).returning('id')
         res.status(201).json({ success: true, message: userId })
      } catch (error) {
      console.error(error)
         res.status(500).json({
            success: false,
            message: error.stack,
         })
      }
   })
   ```

- container laufen als root (Dockerfiles)
   ```dockerfile
   FROM node:18
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 4000
   CMD ["npm", "start"]
   ```
- auth-container hat volle Rechte auf Host
   ```tf
   resource "docker_container" "auth" {
      image = docker_image.auth.name
      name  = "auth"
      networks_advanced {
         name = docker_network.insecure_network.name
      }
      ports {
         internal = 4000
         external = 4000
      }

      privileged = true
      capabilities {
         add = ["SYS_ADMIN", "NET_ADMIN"]
      }

      depends_on = [docker_container.db]
   }
   ```

# A06: Vulnerable and Outdated Components

- TODO

# A07: Identification and Authentification Failures

- kein check für schwache Passwörter in /register (Auth-Service)
 
- JWT ist 1 Jahr lang gültig (Auth-Service)
   ```js
   app.post('/login', async (req, res) => {
      const { email, password } = req.body
      try {
         const query = `SELECT * FROM users WHERE email = '${email}'`
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

         const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '365d' })
         res.status(200).send({ success: true, token })
      } catch (error) {
         console.error(error)
         res.status(500).json({ success: false, message: error.stack })
      }
   })
   ```

# A08: Software and Data Integrety Failures
- bootstrap CDN hash wird nicht geprüft (alle HTML Dateien)
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet"
      crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"
        crossorigin="anonymous"></script>
```

# A09: Security Logging and Monitoring Failures
- kein Logging von login-Versuchen

# A10: SSRF
- Benutzer kann beliebige URL angeben
  ```js
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
  ```
