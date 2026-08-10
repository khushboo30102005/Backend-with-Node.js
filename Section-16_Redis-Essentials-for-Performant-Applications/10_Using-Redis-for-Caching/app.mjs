import express from 'express';
import redisClient from './redis.mjs';
const app = express();

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  const redisKey = `user:${id}`;
  const cachedUser = await redisClient.json.get(redisKey);
  if (!cachedUser) {
    const userData = await getUser(id);
    await redisClient.json.set(redisKey, '$', userData);
    redisClient.expire(redisKey, 60 * 60 * 8)
    return res.json(userData);
  }
  return res.json(cachedUser);
});

app.listen(4000, () => {
  console.log('Server started on 4000');
});

async function getUser(userId) {
  const response = await fetch(`https://fakestoreapi.com/users/${userId}`);
  return await response.json();
}
