import redisClient from './redis.mjs';


// const result = await redisClient.json.set('user:1','$',{"name":"Anurag","age":25,"location":{"city":"Bangalore"}})
// const result = await redisClient.json.set('user:1', '$.name', 'Khushboo Saini')

// const result = await redisClient.json.get('user:1', {
//   path: '$.name'
// })

// const result = await redisClient.json.del('user:1', {
//   path: '$.address'
// })

// const result = await redisClient.json.set('user:1', '$.address', {state: 'Rajasthan'})

const result = await redisClient.json.get('user:1', {
  path: '$.address'
})
// const result = await redisClient.json.numIncrBy('user:1', '$.age', -4);
// const result = await redisClient.json.del('user:1')

// const result = await redisClient.json.set('user:1', '$.hobbies', [])

// const result = await redisClient.json.arrAppend('user:1', '$.hobbies', 'playing', 'walking')


// const result = await redisClient.json.arrPop('user:1', {
//   path: '$.hobbies',
//   index: 0
// });

// const result = await redisClient.json.arrLen('user:1', {
//   path: '$.hobbies',
// });

console.log(result);

redisClient.quit();
