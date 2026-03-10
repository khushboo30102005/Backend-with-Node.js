# 🎯 Introduction to Event-Driven Architecture (EDA)

Event-Driven Architecture is a design pattern used in software development where the flow of the program is determined by events.  
🧠 NodeJS handles I/O operations using EDA, making it efficient for asynchronous, non-blocking tasks like file reads, network requests, etc.

## 🔁 Core Components of EDA:

- Event Emitter   
   The source that generates or emits events.
- Event Listener   
   A function that listens for specific events and triggers an action when the event occurs.
- Event Handler   
  The actual logic/function that runs in response to the event.

## 🧪 Real-Life Examples of EDA:

✅ NodeJS internal architecture  
✅ DOM events in browsers  
✅ Chat applications (e.g., message received)  
✅ Operating Systems handling keyboard/mouse input  
✅ YouTube notifications  
✅ Payment systems (e.g., success/failure callbacks)

## 🔍 Code Example :

```js
const h1 = document.querySelector('h1');
h1.addEventListener('click', () => {
  console.log('h1 clicked');
});
```

**Explanation**:

`h1` → Event Emitter

`addEventListener()` → Event Listener

`The callback function` → Event Handler
