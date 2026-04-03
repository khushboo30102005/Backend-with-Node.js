# HTTP Server using Net Module

- Browser only understand a HTTP response, which is behind the scene a TCP request.
- Chrome Browser expects for "HTTP\n\n" is response.
- but in case of firefox it doesn't require.
- But the correct syntax of writing it is:
- socket.end("HTTP/1.1\n\nHello World");
- If the given HTTP version is not available it will fallback to default version
- Browsers are capable of understanding and handling streams.
- Chrome downloads the video, but firefox plays it
