# Creating UDP Server

- For Creating UDP server, first we have to import `dgram` node module

```js
import dgram from 'node:dgram';
```

- `dgram` have a method `createSocket(socketType)` for create socket

```js
const socket = dgram.createSocket('udp4');
```
### Make a Server 
Bind This Socket with a port number

```js
socket.bind(); // Without providing any port it binds with Ephemeral Ports with address: '0.0.0.0' (ipv4) or address: '::' (ipv6)
```


### What is Socket

**A network socket is one endpoint of a two-way communication link between two programs running on a network.**

It acts as a _"pipe"_ or _interface_, typically identified by an **IP address and port number**, allowing applications to send and receive data.

**A Socket is an EventEmitter.**

- When a Socket is binds with a port number it start to listen massages from client (If it is a sever's socket).
- It Emits `listening` event.

```js
socket.on('listening', () => {
  console.log(socket.address()); //{ address: '0.0.0.0', family: 'IPv4', port: 62248}
  console.log('Listening...');
});
```

#### how server receives messages

```js
socket.on('message', (msg, rinfo) => {
  console.log('Message:', msg.toString());
  console.log('From:', rinfo.address, rinfo.port);
});
```

### Make a Client
- msg : Message that you send to on server
- port : Port number on that server started.
- IpAddress : ip Address of server's devices.

```js
socket.send(msg, port, IpAddress); 
```
