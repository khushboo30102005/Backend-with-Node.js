# More File Operations :

## 1. rename :

```js
fsPromises.rename(oldPath, newPath);
```

Renames `oldPath` to `newPath`.

- move file ->

       rename('index.js', 'C:\\Users\\T14\\Desktop\\index.js')

- move + rename ->

       rename('app.js', 'C:\\Users\\T14\\Desktop\\home.js')

## 2. copy :

```js
fsPromises.copyFile(src, dest[, mode])

copyFile('source.txt', 'destination.txt');
```

src : source filename to copy

dest : destination filename of the copy operation

## 3. cp :

```js
fsPromises.cp(src, dest[, options])
```

src : source path to copy.

dest : destination path to copy to.

recursive -> copy directories recursively Default: `false`, set it `true`
ex:

```js
cp('src', 'C:\\Users\\T14\\Desktop\\backend', { recursive: true });
```

## 4. unlink
```js
// structure :
fsPromises.unlink(path)
// delete a file :
unlink('script.js')
// delete file from desktop :
unlink('C:\\Users\\T14\\Desktop\\backend.js')
```
If path refers to a symbolic link, then the link is removed without affecting the file or directory to which that link refers. **If the path refers to a file path that is not a symbolic link, the file is deleted.**

## 5. rmdir and rm :
```js
fsPromises.rmdir(path[, options])

fsPromises.rm(path[, options])

rmdir('src')  // delete empty directory
rm('dist', {recursive: true})  // delete non-empty directory
rm('index.js')  // also delete a file
```

## 6. writeFile :
**create a Empty file using writeFile()**
```js
writeFile('home.js', "")
```

## 7. mkdir:
```js
fsPromises.mkdir(path[, options])
```

```js
mkdir('src')  // create a directory
writeFile('./src/home.js', "")   // create a file inside a directory
rename('src', 'build')   // rename the directory
rm('build', {recursive:true})  // delete a non-empty directory
```

## 8. stat
```js
fsPromises.stat(path[, options])
```
Returns a promise. It's provides information about give file or dir path.
```js
const stats = await stat('app.js')
console.log(stats)
```
outPut:
```js
Stats {
  dev: 5051535,
  mode: 33206,
  nlink: 1,
  uid: 0,
  gid: 0,
  rdev: 0,
  blksize: 4096,
  ino: 47287796087394590,
  size: 975,
  blocks: 8,
  atimeMs: 1771408412090.8376,
  mtimeMs: 1771408381740.4272,
  ctimeMs: 1771408381740.4272,
  birthtimeMs: 1771389185063.772
}
```

## 9. watch (from fs)
used to track changes in a file.
```js
watch('file.txt', ((eventName, fileName) => {
console.log("Event: ", eventName)
}))
```
output:

```js
Event:  rename
Event:  rename
Event:  change
Event:  rename
Event:  rename
Event:  change
Event:  change
```