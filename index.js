const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
// const https = require('https')
// const path = require('path')
// const fs = require('fs')
const authRouter = require('./routes/auth')
const postRoute = require('./routes/private') 
const dotenv = require('dotenv')
dotenv.config()
const db = require('./db')

const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = 8000

app.use('/user',authRouter)
app.use('/post',postRoute)

app.get('/', (req, res) => {
  console.log(JSON.stringify(req.body))
  res.send('Helcome! This is the portfolio backend')
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})

// const sslServer = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
//     cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
//   },
//   app
// )

// sslServer.listen(3443, ()=>{
//   console.log('App listening at http://localhost:3443')
// })