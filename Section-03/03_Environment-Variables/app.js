const envVariables = process.env;
// setInterval(() => {
//   console.log("Env Variables:", envVariables);
// }, 5000)
// const { execSync } = require("child_process");

// try {
//   execSync("net session", { stdio: "ignore" });
//   console.log("✅ VS Code / Node is running as ADMIN");
// } catch {
//   console.log("❌ VS Code / Node is NOT running as ADMIN");
// }

// const {exec} = require('child_process');
// // const { log } = require('console');
// // exec(`powershell -Command "setx Demo_var2 'Node.js' /M"`)
// console.log("Running");

// exec(`powershell -Command "setx Demo_var2 'Node.js' /M"`, (error, stdout, stderr) => {
//   if (error) {
//     console.error("Error:", error.message);
//     return;
//   }
//   console.log("System environment variable created successfully");
// });

// // how to set env variables in real projects...

const fs = require('fs');
const fileData = fs.readFileSync('./.env').toString();
// const fileDataArr = fileData.includes('\n');
// console.log(fileDataArr);
// const fileDataArr2 = fileData.includes('\r\n');
// console.log(fileDataArr2);
// CODE SUITABLE FOR BOTH CRLF AND LF END OF LINE SEQUENCES...
/* if (fileData.includes('\r\n')) {
  fileData.split('\r\n').forEach((variable) => {
    const [key, value] = variable.split('=');
    process.env[key] = value;
  });
} else {
  fileData.split('\n').forEach((variable) => {
    const [key, value] = variable.split('=');
    process.env[key] = value;
  });
} */
//SAME CODE USING  REGEX : 

fileData.split(/\r?\n/).forEach(variable => {
  const [key, value] = variable.split('=')
  // console.log( [key, value] );
  process.env[key] = value
})


setInterval(()=>{
  const a = process.env
  console.log('hii');
}, 2000)
