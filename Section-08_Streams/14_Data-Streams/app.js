// Readable Stream :
// console.log(process.stdin)
// console.log(process.stdin.fd); // 0

// Writable Streams :
// console.log(process.stdout)
// console.log(process.stderr)
// console.log(process.stdout.fd); //1
// console.log(process.stderr.fd); //2

// process.stdin.write('hii')  // Error
// We can't write using stdin so it give an error

// Write using stdout:
// process.stdout.write('Hii\n')   // works same as console.log, clg use this behind the scenes

// Write using stderr:
// process.stderr.write('Hii\n')   // works same as stdout 

// Read using stdin:
// Using on method on process.stdin through the listen data event we get access on inputs of terminal, means after start this nodejs process using node app.js the terminal wait for next input that will be provided through keyboard (ByDefault) and we can perform any task on this input data like log it on terminal and write data into the stream.

/* import fs from 'fs';
const WriteStream = fs.createWriteStream('output.txt');
process.stdin.on('data', (chunk) => {
  console.log('Data Received: ', chunk.toString());
  // WriteStream.write(chunk)
});

process.stdin.pipe(WriteStream); */


// Import spawn from child_process.
import {spawn} from 'child_process'
import { createWriteStream } from 'fs'

// Using spawn we can spawn a new process by given command
// Here, cat output.txt command will be run:
/* const childProcess1  = spawn('cat', ['output.txt'])

// the output of this command is now not display in terminal instead of that the output is stored in childProcess1.stdout.

childProcess1.stdout.on('data', (chunk) => {
  console.log(chunk.toString())
}) */

// childProcess1.stdin.write('hii') // not any effect

// Now spawn a nodejs process using child_process.spawn() function

const childProcess = spawn('node', ['childApp.js'])
// The data that received from this child process is stored in stdout dataStream of parent process of this running process (node childApp.js), using on method on childProcess we can customize it. like that :
// childProcess.stdout.on('data', (chunk) => {
//   console.log(chunk.toString())
// })

// childProcess.stdin.write('Hii')

// the childApp's stdout data find in childProcess.stdio because childApp.js's process is the child of this process 
const writeStream = createWriteStream('zoom.mp4')
// write data in the writeStream: 
childProcess.stdout.pipe(writeStream)