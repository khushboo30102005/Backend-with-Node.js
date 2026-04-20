# PreFlight Request

**_Preflight = Browser ka trial request before main request to verify CORS rules._**

**A Preflight Request is a special browser check request sent before the actual cross-origin request when using CORS.**

It asks the server:

> “Hey server, before I send the real request, are you okay with this method / headers from this origin?”

## Why Preflight Exists

**Browsers use it for security.**

If a website from one origin wants to send a risky request to another origin, the browser first checks permission.

## When Browser Sends Preflight

**Usually when the real request is not a simple request, such as:**

- Method is `PUT, PATCH, DELETE`

- Custom headers are used (Authorization, X-Custom-Header)
- Content-Type is not simple (application/json often triggers depending on context)

## How It Works

- Suppose frontend runs on:

http://localhost:3000

- Backend runs on:

http://localhost:5000

- Frontend sends:

```js
fetch('http://localhost:5000/user', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

- Before PATCH request, browser sends:

```http
OPTIONS /user HTTP/1.1
Origin: http://localhost:3000
Access-Control-Request-Method: PATCH
Access-Control-Request-Headers: Content-Type
```

**This is the Preflight Request.**

## Important Point

- Browser sends preflight automatically

- You do not manually send it.

#### In CORS, browsers divide cross-origin requests into two categories:

### 1. Simple Request

**A request that is considered safe enough to send directly without a preflight (OPTIONS) request.**

The browser sends the real request immediately.

Usually Simple If:

- Allowed Methods:

  `GET`

  `HEAD`

  `POST`

- Only Simple Headers:

  Examples:

  `Accept`

  `Accept-Language`

  `Content-Language`

  `Content-Type (only specific values)`

- Allowed Content-Type Values:

  `text/plain`

  `application/x-www-form-urlencoded`

  `multipart/form-data`

- Example of Simple Request:

  ```js
  fetch('http://api.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
  });
  ```

**Browser sends request directly.**

### 2. Non-Simple Request

**A request that may be more sensitive or complex, so browser sends a preflight request first.**

Usually Non-Simple If:

- Method Is:

  `PUT`

  `PATCH`

  `DELETE` etc.

- Custom Headers Used:

  `Authorization`

  `X-Token`

  `X-Custom-Header`

- Content-Type Is:

  `application/json`
  
  `application/xml`

etc.

- Example

  ```js
  fetch('http://api.com/user', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  ```

- Browser first sends:

  ```js
  OPTIONS / user;
  ```

**Then if allowed, sends actual PATCH request.**
