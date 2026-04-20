# What is CORS?

**CORS = Cross-Origin Resource Sharing**

It is a browser security mechanism that allows or blocks requests from one website to another website (different origin).

## What is an Origin?

**An origin = Protocol + Domain + Port**

- Examples:

```
http://localhost:3000
http://localhost:5000
```

These are different origins because ports are different.

## Important Truth

- Many beginners think:

**CORS blocks requests**

- Actually:

**Same-Origin Policy (SOP) blocks requests by default**

**CORS is the permission system to relax that rule.**

## What Browsers Used Before CORS?

All old browsers used the **Same-Origin Policy (SOP)** before **CORS** became standard.

### In Express.js

You often solve it using:

- Allow all:
```js
import cors from "cors";
app.use(cors());
```

- or restricted:

```js
app.use(
  cors({
    origin: 'http://localhost:3000',
  }),
);
```
