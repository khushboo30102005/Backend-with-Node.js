// Accessing Process Properties

// Command-line arguments
process.argv;

// Environment variables
process.env;

// Current process ID
process.pid;

// Parent process ID
process.ppid;

// Operating system platform
process.platform;

// Node.js version
process.version;

// Node.js and dependencies versions
process.versions;

// Processor architecture
process.arch;

// Using Process Methods
// Current working directory
process.cwd();

// Change working directory
process.chdir("/tmp");

// Memory usage
process.memoryUsage();

// Process uptime
process.uptime();

// Exiting the process
// process.exit(0);

// Kill the process
process.kill(process.pid);

// Emit warning
process.emitWarning("This is a custom warning message!", {
  code: "MY_WARNING_CODE",
  detail: "This is some additional warning detail.",
});

// Interacting with stdin, stdout, and stderr streams
process.stdout.write("Hello, stdout!\n");
process.stderr.write("Hello, stderr!\n");

// Next Tick demonstration
process.nextTick(() => {
  // This will run on the next tick of the event loop.
});

// Registering event listeners
process.on("exit", (code) => {
  // Process is about to exit with code
});

process.on("warning", (warning) => {
  // Handle warning
});

process.stdin.on("data", (data) => {
  // Process input data
});
