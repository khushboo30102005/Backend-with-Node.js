## ✅BackPressure and Internal Buffer of Writable Streams

**BackPressure** :  
When the data is fill more than highWaterMark value (overflow writable buffer accept the data it not reject it). so we have to stop and wait the data to be written and then continue. to prevent the left over data accumulate in memory and prevent high memory usage.  
So we pause the readableStream to read and wait when the it is empty so we resume

When assign a thought write using writableStream return Boolean value to know it is empty or not True/False
we get drain emitter (listener) so when it is empty it will execute the callback in the eventEmitter
