import { watch } from 'node:fs';
import {
  rename,
  copyFile,
  cp,
  unlink,
  rmdir,
  rm,
  writeFile,
  mkdir,
  stat,
  readFile
} from 'node:fs/promises';

// watch('file.txt', ((eventName, fileName) => {
// console.log("Event: ", eventName)
// }))
watch('file.txt',(async (eventType) => {
  if(eventType === 'change'){
    console.log(await readFile('file.txt', 'utf-8'))
  }
}) )
// const stats = await stat('app.js')
// console.log(stats)

// create a empty file :
// mkdir('src')
// writeFile('./src/home.js', "")
// rename('src', 'build')
// rm('build', {recursive:true})
// remove dir
// rmdir('src')  // delete empty directory
// rm('dist', {recursive: true})  // delete non-empty directory
// rm('index.js') // delete a file
// rename( 'home.js','index.js')
// copyFile('index.js', 'home.js')

// copy file on desktop ->
// copyFile('./index.js', "C:\\Users\\T14\\Desktop\\backend.js")

// copy dir ->

// cp('src', 'C:\\Users\\T14\\Desktop\\backend', {recursive: true})

// move file ->

// rename('index.js', 'C:\\Users\\T14\\Desktop\\index.js')

// move + rename ->
// rename('app.js', 'C:\\Users\\T14\\Desktop\\home.js')

// delete a file :
// unlink('C:\\Users\\T14\\Desktop\\backend.js')
