import { createClient } from 'redis';

const redisClient = createClient();

await redisClient.connect();

let cursor = '0';

do {
  const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
    MATCH: '*',

    COUNT: 20,
  });

  console.log(nextCursor);

  console.log(keys);

  cursor = nextCursor;
} while (cursor !== '0');

await redisClient.quit();
