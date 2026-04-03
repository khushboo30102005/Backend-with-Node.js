##  Format to Send Headers on a Socket (HTTP over TCP)

### 🔹 Basic Idea (Conceptual)


```js
socket.write('res_Headers\n\nresponse_data');
```

👉 This basically means:

- Header section → res_Headers
- Separator → \n\n
- Body / actual data → response_data

- This represents the core protocol idea:

> Separate metadata (headers) from actual data (body)

### 🔹 Standard HTTP Format (Correct Version)
```js
socket.write(
  'HTTP_version Status_Code Status_Message\nResponse_Header1: val\nResponse_header2: val\n\n',
);
```

#### 🔹 Example (Correct & Practical):

```js
socket.write('HTTP/1.1 200 OK\n');
socket.write('Access-Control-Allow-Origin:*\n');
socket.write('Access-Control-Expose-Headers:*\n');
socket.write('Hello:World'); // // custom header
socket.write('\n\n');
```
