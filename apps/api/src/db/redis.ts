import Redis from 'ioredis';
import env from '../config/env.js';

export const redis = new (Redis as any)(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('error', (err: Error) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

export async function closeRedis() {
  await redis.quit();
}
