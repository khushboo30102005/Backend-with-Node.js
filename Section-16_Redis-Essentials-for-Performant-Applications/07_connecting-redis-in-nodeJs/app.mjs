/* import { createClient } from 'redis';

const redisClient = await createClient().connect();
redisClient.select(1)
const user = {
  name: 'Khushboo',
  age: 22,
  email: 'khushboo@gmail.com',
};
const result = await redisClient.get('user', JSON.stringify(user));

console.log(JSON.parse(result));
// console.log(result)

await redisClient.quit();
 */

import redisClient from "./redis.mjs";

const result = await redisClient.getJSON('test', {name: 'khushboo'})
console.log(result)

redisClient.quit()