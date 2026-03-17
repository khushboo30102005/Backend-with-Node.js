# **Duplex Stream**

**A Duplex stream is both readable and writable**, but its two sides operate independently. Data written to the writable side does not automatically flow to the readable side.

**Purpose**: Used for scenarios involving **bidirectional communication** where the input and output are not directly related.

**Example**: A `net.Socket` (**TCP connection**) is a duplex stream because you can write data to the socket (send a request) and read data from it (receive a response), but the data being read is the server's response, not an echo of your request.

# Transform Stream

A Transform stream is a specialized type of duplex stream where the output is a result of a transformation applied to the input. The data written to the writable side is processed and then made available on the readable side.

**Purpose**: Used to modify or process data as it passes through a pipeline, such as compression, encryption, or parsing.

**Example**: The built-in `zlib.createGzip()` stream compresses data as it flows from a readable source to a writable destination. Custom transform streams are created by implementing the `_transform()` method, as shown in the Node.js documentation.

# PassThrough Stream

**A PassThrough stream is a trivial implementation of a transform stream that simply passes the input data to the output without any modification.**

- **Purpose**: It acts as a tunnel or placeholder in a stream pipeline.
  **It is often used for:**
  - **Observing data** in a pipeline without affecting it (by attaching an event listener).

  - **Debugging** data flow.

  - **Building complex pipelines** where a stage might later be replaced with a real transformation.
