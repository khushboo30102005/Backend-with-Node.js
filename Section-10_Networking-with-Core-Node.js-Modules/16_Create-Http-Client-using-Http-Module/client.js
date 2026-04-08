import http from 'node:http';

// ### Create a clientRequest :

// ByDefault request method is GET and it does not send data
// For getting data (request) on server from client , the value of method is should not be GET
// It can be POST, PUT etc.

const clientRequest = http.request({ port: 4000, method: 'POST' });

// Write data on Request
clientRequest.write('Hii, from Client...');
clientRequest.end();

// ### Get response on client from server :

// Using response event we get response that come from server for client

// On Server response is a writable stream
// BUT
// On client response is a readable stream

clientRequest.on('response', (response) => {
  response.on('data', (chunk) => {
    console.log(chunk.toString());
  });
});
