import app from './server.js';
import { env } from './config/environment.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import logger from './utils/logger.js';
import { startWorkers } from './jobs/workers.js';

async function main() {
  try {
    // Подключаем PostgreSQL
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');

    // Проверяем Redis
    await redis.ping();
    logger.info('✅ Redis connected');

    // Запускаем воркеры BullMQ
    await startWorkers();
    logger.info('✅ Workers started');

    // Запускаем сервер
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    });

  } catch (error) {
    logger.error('❌ Startup error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

main();
