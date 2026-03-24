> Try and practices this we have to open bash terminal in WSL-Window 

## piping (|) : 
**Connect stdout of process one to stdin of process two**

### 1. 
```bash
echo hii| node app.js 
```

```js
//app.js
  process.stdin.setEncoding('utf-8')

  process.stdin.on('data', (chunk) => {
    console.log("App.js: ",chunk)
  }) 
```
```bash
  # Output: 
  App.js:  hii 
```  
### 2. 

```bash
node script.js | node app.js 
```

```js
//script.js
process.stdout.write('stdout: Hii From Script.js\n')
process.stderr.write('stderr: Hii From Script.js\n')  // piping does not pipe stderr 
```
```js
//app.js
  process.stdin.setEncoding('utf-8')

  process.stdin.on('data', (chunk) => {
    console.log("App.js: ",chunk)
  }) 
```
```bash
  # Output: 
  stderr: Hii From Script.js
  App.js:  stdout: Hii From Script.js

```  

##  Redirection (`<`,`>`):
**Connect Stdout of one process to another file**

### example:  
### 1.
```bash
echo hii > output.txt
```

### 2. 

```js
//script.js
process.stdout.write('stdout: Hii From Script.js\n')
process.stderr.write('stderr: Hii From Script.js\n')  
```
* ByDefault only stdout written in output.txt file.

```bash
  node script.js > output.txt 
```
* Write stderr:
```bash
  node script.js 2> output.txt 
```
* Write both:
```bash
  node script.js > output.txt  2>> output.txt 
```

* connect file data to stdin another process:
```bash
  node script.js < output.txt 
```
```bash
15_Piping-and-Redirection-of-Data-Streams  (main) ❯ node script.js < output.txt 
stdout: Hii From Script.js
stderr: Hii From Script.js
```