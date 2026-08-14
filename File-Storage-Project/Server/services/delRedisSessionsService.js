import redisClient from "../config/redis.js";

export async function deleteAllSessionsForUser(userId) {
  const allSessions = await redisClient.ft.search(
    'userIdIdx',
    `@userId:{${userId}}`,
    { RETURN: [] },
  );
  await Promise.all(
    allSessions.documents.map((document) => redisClient.del(document.id)),
  );
}