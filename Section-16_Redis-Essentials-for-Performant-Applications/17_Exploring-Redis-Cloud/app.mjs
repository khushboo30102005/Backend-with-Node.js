import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://redis-.............redis-cloud.com:19577",
  password: ".........",
});
await redisClient.connect();

const result = await redisClient.keys("*");
console.log(result);

await redisClient.quit();
