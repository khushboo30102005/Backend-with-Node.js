#  Event Emitter in Node.js
Node.js provides a built-in EventEmitter class to implement the Event-Driven Architecture pattern in server-side applications.

##  How to Use:
You can import it like this:
```js
import EventEmitter from "events";
```
This class gives access to many powerful methods for working with custom events — such as:  

`.on()` → Register an event listener

`.emit()` → Trigger the event

`.once()` → Handle the event only once

`.setMaxListeners()` → Set the max number of listeners per event

## Internally:
When an event is registered:

It’s stored as a key inside the internal _events object
The value is the handler function (or an array of handlers, if multiple are added)  

💡 If you register multiple handlers for the same event, Node will automatically convert the value into an array of functions, and all will be executed when the event is emitted.
