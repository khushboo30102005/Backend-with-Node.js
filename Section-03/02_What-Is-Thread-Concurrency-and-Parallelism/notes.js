// "Spawning" a process or a thread refers to creating a new, separate execution context from a currently running program.

// Spawning a Thread A thread is a lightweight execution unit that runs within the same memory space as its parent process, allowing for efficient communication and resource sharing. 

// I explored Concurrency vs Parallelism and understood how they truly impact performance and time optimization.

// 🔹 I first executed three heavy for loops on the single main thread — the result?
// Execution was slow and blocking, consuming more time.

// 🔹 Then I re-ran the same logic using Worker Threads (multithreading) in Node.js.
// Each task ran in parallel, utilizing multiple threads — and the performance improvement was clearly visible ⚡

// ✨ Key Learning:

// Concurrency helps manage multiple tasks efficiently

// Parallelism actually runs tasks simultaneously

// For CPU-intensive operations, Worker Threads are a game changer in Node.js

// This experiment made it clear how choosing the right execution model can optimize time, improve performance, and scale applications better.

// we can debug the worker threads for better results through breakpoints.
