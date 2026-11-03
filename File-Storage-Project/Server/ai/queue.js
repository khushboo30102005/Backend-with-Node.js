import { aiConfig } from '../config/ai.js';

// Tiny in-process FIFO queue (one job at a time) so a small server is never
// overloaded by several LLM calls at once. Jobs are recoverable: anything
// still "queued"/"processing" after a restart is marked failed on boot.
const jobs = [];
let running = 0;
const CONCURRENCY = 1;

export function queueSize() {
  return jobs.length + running;
}

export function hasCapacity() {
  return queueSize() < aiConfig.maxQueue;
}

export function enqueue(job) {
  jobs.push(job);
  pump();
}

function pump() {
  while (running < CONCURRENCY && jobs.length > 0) {
    const job = jobs.shift();
    running += 1;
    Promise.resolve()
      .then(job)
      .catch((err) => console.log('AI job error:', err?.message))
      .finally(() => {
        running -= 1;
        pump();
      });
  }
}
