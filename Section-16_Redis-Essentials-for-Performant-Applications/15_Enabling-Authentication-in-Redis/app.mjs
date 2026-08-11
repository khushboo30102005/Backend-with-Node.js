import { createClient } from "redis";

const redisClient = createClient({
  password: "<yourRedisRequirePass>",
});
await redisClient.connect();

const result = await redisClient.ping();
console.log(result);

await redisClient.quit();
