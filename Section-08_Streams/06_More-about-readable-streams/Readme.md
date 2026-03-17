# Stream Events & Methods Summary

**data**: Emitted when data is available to read (in chunks). Use encoding: "utf8" to get strings instead of buffers. if you are dealing with txt files 

**end**: Emitted when the stream has no more data.

**pause()**: Method to stop 'data' events (pause reading).

**resume()**: Method to resume 'data' events.

**close**: Emitted when the stream and underlying resource are closed.

**error**: Emitted when there’s an error (e.g., file not found).

**readable**: Emitted when data can be read using .read().

**destroy()**: Method to forcefully stop and clean up the stream.