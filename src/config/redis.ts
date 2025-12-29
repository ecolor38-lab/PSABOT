import IORedis from 'ioredis';
import { env } from './environment.js';

// Основное подключение
export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Фабрика для создания новых подключений (для BullMQ)
export function createRedisConnection(): IORedis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Проверка подключения
export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    console.log('✅ Redis подключен');
  } catch (error) {
    console.error('❌ Ошибка подключения к Redis:', error);
    throw error;
  }
}

// Отключение
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}


