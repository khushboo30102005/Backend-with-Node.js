import express from 'express'
import {open} from 'node:fs/promises'

const app = express()

const port = 4000

// Server files of a particular directory like "public"
// express.static() is built-in middleware that serves files from a folder.
app.use(express.static("public"))


// Serve a specific file from global dir/ main folder
app.get('/test',async (req, res) => {

/*   // send a video file with streams manually
  const fileHandle = await open('Zoom.mp4')
  const {size} = await fileHandle.stat()
  const readStream = fileHandle.createReadStream()
  res.setHeader('Content-Type', 'video/mp4')
  res.setHeader('Content-Length', size)
  res.setHeader('Accept-Ranges','bytes');
  readStream.pipe(res)
 */

  // With express buildIn Method:

  res.sendFile(import.meta.dirname+'/Zoom.mp4')
  
})

app.listen(port, () => {
  console.log("server started" )
})

