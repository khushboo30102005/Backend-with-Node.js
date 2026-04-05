### 1. Content-Type

👉 Defines what type of data is being sent in the response and how to decode it.

```js
socket.write('Content-Type: text/txt; charset=utf-8\n');
```

- Common Types:
  ```js
  text / plain;
  text / html;
  application / json;
  image / webp;
  video / mp4;
  application / pdf;
  ```

### 2. Content-Length

- 👉 Defines the exact size (in bytes) of the response body.

- It useful when browser download a file because it show downloading with percentage, speed and remaining time.

- If Response data is less than Content-length : A Infinite Loop Occur on Browser because browser waits for remaining data.

- If response data is more than Content-Length: Browser is ends the socket and closes the connection.
- If Both are Same: It breaks infinite loop and connection is maintain here.

  ```js
  socket.write('Content-Type: text/txt; charset= utf-8\n');
  socket.write('Content-Type: video/mp4\n');
  socket.write('Content-Type: image/webp\n');
  socket.write('Content-Type: application/json\n');
  socket.write('Content-Type: application/pdf\n');
  ```

### 3. Content-Disposition

- 👉 Controls how the browser should handle the file
  (download vs display)

- Behavior:
  - attachment → Force download

  - inline → Open in browser (default)

- We can set filename here also.

  ```js
  socket.write('Content-Disposition: attachment; filename=story.mp4');
  ```

#### 👉 HTTP response headers tell the browser:

- What data is coming → `Content-Type`

- How much data is coming → `Content-Length`
- What to do with it → `Content-Disposition`
