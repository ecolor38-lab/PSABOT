import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/environment.js';

export const healthRouter = Router();

// GET /api/health — проверка состояния
healthRouter.get('/', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    openai: !!env.OPENAI_API_KEY,
    telegram: !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  };

  // Проверяем PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {}

  // Проверяем Redis
  try {
    await redis.ping();
    checks.redis = true;
  } catch {}

  const allHealthy = checks.database && checks.redis;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: checks,
  });
});


