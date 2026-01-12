// why learn os for backend (NOdejs) -->
// because when we work with nodejs we have access of os resources like file system, memory, cpu, networking capabilities, environment variables etc.
// so having a basic understanding of os concepts will help us to write better backend applications using Nodejs.

// What is Operating System (OS)?
// An Operating System is System Software that acts as an interface between the user and the computer hardware. It manages hardware resources and provides services for computer programs.

// CPU (Central Processing Unit): The brain of the computer that performs instructions defined by software.
//  its not cabinet (in general we called it CPU but it is the box that contains the CPU inside itself)

// Processor: Another term for CPU. 

// Cores: cores are not visible but they are stay inside the CPU. 
// Core is a single processing unit within the CPU. Modern CPUs can have multiple cores, allowing then to perform multiple tasks simultaneously (multitasking).

// Logical Cores: Logical cores in a CPU are virtual processing units created by technologies like Hyper-Threading, allowing a single physical core to handle multiple instruction threads simultaneously, making the operating system see more processors than physically exist (e.g., 4 physical cores with 2 threads each appear as 8 logical cores) for better multitasking and performance, though they share the physical core's resources. 

// How to check numbers of logical cores in your system?
// First using Task manager (for windows)

// Second using terminal -->

// node
// os.availableParallelism()  // it will give you number of logical cores in your system.


// What is Kernel?
// The Kernel is the core component of an Operating System that manages System resources, facilitates communication between hardware and software, and ensures efficient operation of the computer by handling tasks such as memory management, process scheduling, and device control.

// how multiple applications run at the same time on a computer? --> 
// using  context switching -> switching between multiple tasks so quickly that it gives the illusion of simultaneous execution.
