import { createClient } from "redis";

const redisClient = createClient();
await redisClient.connect();

await redisClient.publish('node_channel', 'Hello from publisher');

await redisClient.subscribe('cli_channel', (message) => {
  console.log('Received:', message);
});
setTimeout(async () => {
  await redisClient.unsubscribe("cli_channel");
}, 5000);

// await redisClient.quit();
