import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    // retry quickly at first, then back off to at most 2s; give up after ~30s
    reconnectStrategy: (retries) => {
      if (retries > 30) return new Error('Redis unreachable');
      return Math.min(retries * 200, 2000);
    },
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