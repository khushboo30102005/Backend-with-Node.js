import express from 'express'
import {open} from 'node:fs/promises'

const app = express()

const port = 4000

app.get('/', (req, res) => {

  // Manual way:
  // res.setHeader('Content-Type','application/json')
  // res.end(JSON.stringify({message: "Hello Express"}))

  // Express Way: 
  // res.json(({message: "Hello Express"}))

  // Update status Code
  res.status(300).json(({message: "Hello Express"}))
})

app.listen(port, () => {
  console.log("server started" )
})

