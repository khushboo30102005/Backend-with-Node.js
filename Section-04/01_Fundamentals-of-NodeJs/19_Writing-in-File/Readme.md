# fs.writeFile() OR fs.appendFile()

- fs.writeFile() -> override the file content
- fs.appendFile() ->continue writing in the file

## Examples of using writeFile method :

### 1. make copy command :

```js
const copyImg = await fs.readFile(process.argv[2]);

fs.writeFile(process.argv[3], copyImg);
```

- How it works:
  - this command receives two arguments one image path that you want to copy and second path where store this image.
  - ex:
    ```bash
     copy 'cpu-img.jpg' 'C:\\Users\\T14\\Desktop\\cpuImg.png'
    ```
    ```bash
    copy "C:\Users\T14\Downloads\Dont_Chase.jpg" 'C:\\Users\\T14\\Desktop\\quote.png'
    ```

### 2. make a watch that show real time:

```js
setInterval(() => {
  fs.writeFile('time.txt', new Date().toLocaleTimeString());
}, 1000);
```

### 3. Write errors in error.log file:

```js
try {
  const fileData = await fs.readFile('cpu-imgg.jpg');
  fs.writeFile('C:\\Users\\T14\\Desktop\\test.jpg', fileData);
} catch (error) {
  const errorMsg = `${new Date().toLocaleTimeString()}\nmessage: ${error.message} \nStack: ${error.stack}\n\n`;
  fs.appendFile('error.log', errorMsg);
  console.log(error);
  console.log('To see full error message got to ./error.log file.');
}
```
