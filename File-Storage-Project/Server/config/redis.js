import { createClient } from 'redis';

const redisClient = createClient({
  password: process.env.REDIS_PASS
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
  process.exit(1);
});

await redisClient.connect();

export default redisClient;
