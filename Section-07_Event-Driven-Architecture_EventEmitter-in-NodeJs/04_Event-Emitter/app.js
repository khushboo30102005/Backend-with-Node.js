import EventEmitter from 'events'

const emitter = new EventEmitter()

// emitter.setMaxListeners(2) 

emitter.once('abc', () => {
  console.log("abc event fired..2")
})

emitter.on('x', () => {
  console.log("x event fired..")
})
emitter.once('y', () => {
  console.log("y event fired..1")
})
emitter.on('y', (a) => {
  console.log(a, "y event fired..2")
})
emitter.on('y', (a) => {
  console.log(a, "y event fired..2")
})



emitter.emit('abc', 5)


// console.log(emitter)