class MyEventEmitter {
  constructor() {
    this._events = {};
    this._once = {};
  }
  on(eventName, handler) {
    if (this._events[eventName]) {
      this._events[eventName].push(handler);
    } else {
      this._events[eventName] = [handler];
    }
  }

  emit(eventName, ...args) {
    this._events[eventName]?.forEach((event) => {
      console.log(args);
      event(...args);
      if(this._once[eventName]){
        delete this._events[eventName]
        delete this._once[eventName]
      }
    });
    
  }

  once(eventName, handler) {
    if (this._events[eventName]) {
      this._events[eventName].push(handler);
    } else {
      this._events[eventName] = [handler];
    }
    this._once[eventName] = [handler];
  }
}

const myEmitter = new MyEventEmitter();
myEmitter.on('x', (a, b, c) => {
  console.log('hello', a, b, c);
});
myEmitter.once('y', () => {
  console.log('hello2');
});
// myEmitter.emit('x', 1, 2, 3);
console.log(myEmitter);
myEmitter.emit('y');
console.log(myEmitter);
myEmitter.emit('y');
