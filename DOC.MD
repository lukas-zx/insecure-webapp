# A01: Broken Access Control

- Löschfunktion ist öffentlich Zugänglich, ohne Zugriffskontrolle oder Kontrolle, ob User die erforderlichen Berechtigungen hat (Auth-Service)
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

- Admin-Panel ist ohne Auth zugänglich (Frontend)
    ```js
   app.get('/admin-panel', (req, res) => {
      res.sendFile(path.resolve('./src/admin-panel.html'))
   })
   ```
   
# A02: Cryptographic Failures

- Passwort-Hashing bei Registrierung mit MD5 und ohne salt (Auth-Service)
    ```js
   const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
   ```
  
- JWT secret ist hardcoded (Auth-Service)
   ```js
   const SECRET_KEY = 'secret-key'
   ```
  
- DB-Zugang ist hard coded (Auth-Service)
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
   
- Services kommunizieren per HTTP
   ```js
   const auth_service_url = 'http://auth:4000'
   ```
   
# A03: Injection

- SQL Injection bei login möglich (Auth-Service)
   ```js
   const query = `SELECT * FROM users WHERE email = '${email}'`
   const result = await db.raw(query)
   ```
  
- Austausch von innerHTML mit User-Input im admin-panel
  ```js
  const tdUsername = document.createElement('td')
  tdUsername.innerHTML = user.username
  tr.appendChild(tdUsername)

  const tdEmail = document.createElement('td')
  tdEmail.innerHTML = user.email
  tr.appendChild(tdEmail)
  ``` 

# A04: Insecure Design

- Passwort zurücksetzen im Auth-Service funktioniert anhand einer Sicherheitsfrage
  ```js
  if (user.security_answer !== securityAnswer) {
    return res.status(401).json({ success: false, message: 'Incorrect security answer' })
  }
  ```

# A05: Security Misconfiguration

- CORS-Einstellung (Auth-Service)
    ```js
    app.use(cors())
    ```
  
- Sicherheitseinstellungen für JWT-Cookie fehlen
    ```js
    res.cookie('token', data.token, { maxAge: 365 * 24 * 60 * 60 * 1000 })
    ```
  
- Keine SSL Verbindung zur Datenbank (knexfile)
   ```js
   ssl: false
   ```
  
- x-powered-by HTTP Header ist nicht disabled

- in /register wird Stack-Trace zurück gegeben (Auth-Service)
   ```js
   res.status(500).json({
      success: false,
      message: error.stack,
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
- Auth-Container hat volle Rechte auf Host
   ```tf
   privileged = true
   capabilities {
      add = ["SYS_ADMIN", "NET_ADMIN"]
   }
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

# A06: Vulnerable and Outdated Components

- Im Auth-Service wird eine veraltete Express-Version verwendet. 
  ```json
  "dependencies": {
      "body-parser": "^1.20.3",
      "cors": "^2.8.5",
      "crypto": "^1.0.1",
      "express": "4.16.0",
      "jsonwebtoken": "^9.0.2",
      "knex": "^3.1.0",
      "nodemon": "^3.1.7",
      "pg": "^8.13.1"
  }
  ```
  
- Im Frontend wird eine EOL-Version von node.js und ein Base-Image mit unnötigen Features verwendet, welches zudem auch EOL ist.
  ```dockerfile
  FROM ubuntu:16.04
  RUN apt-get update && apt-get install -y \
    curl \
    wget \
    nano \
    build-essential \
    python \
    && curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean

  WORKDIR /app
  COPY package*.json ./
  RUN npm install

  COPY . .

  EXPOSE 3000
  CMD ["npm", "start"]
  ```

# A07: Identification and Authentification Failures

- kein check für schwache Passwörter in /register (Auth-Service)
 
- JWT ist 1 Jahr lang gültig (Auth-Service)
   ```js
   const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '365d' })
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
- Benutzer kann beliebige URL angeben (frontend)
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
