import { createClient } from 'redis';
import { reconnectDelay } from './redisRetry.js';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  // Hosted Redis drops idle connections; a periodic PING keeps the socket
  // alive and surfaces a dead connection quickly so reconnecting starts.
  pingInterval: 60 * 1000,
  socket: {
    connectTimeout: 15000,
    // Exponential backoff with jitter, retrying forever (M10).
    reconnectStrategy: (retries) => reconnectDelay(retries),
  },
});

let lastLogged = 0;
redisClient.on('error', (err) => {
  // log at most once every 5s instead of on every retry
  if (Date.now() - lastLogged > 5000) {
    console.log('Redis Client Error:', err.code || err.message);
    lastLogged = Date.now();
  }
});

let wasDown = false;
redisClient.on('reconnecting', () => {
  if (!wasDown) console.log('Redis connection lost; reconnecting with backoff');
  wasDown = true;
});
redisClient.on('ready', () => {
  if (wasDown) console.log('Redis reconnected');
  wasDown = false;
});

await redisClient.connect();

// Create the session index if it doesn't exist (idempotent). Needs RediSearch + JSON (Redis Cloud / Redis Stack).
try {
  await redisClient.ft.create(
    'userIdIdx',
    { '$.userId': { type: 'TAG', AS: 'userId' } },
    { ON: 'JSON', PREFIX: 'session:' },
  );
  console.log('Created Redis index userIdIdx');
} catch (err) {
  if (!String(err.message).includes('Index already exists')) throw err;
}

export default redisClient;
