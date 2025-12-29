import { prisma } from '../lib/prisma.js';
import { addPublishJob, addGenerateJob } from '../lib/queues.js';
import { logger } from '../lib/logger.js';

// Интервал проверки (каждую минуту)
const CHECK_INTERVAL = 60 * 1000;

export async function startScheduler() {
  logger.info('Планировщик запущен');

  // Проверяем запланированные посты
  setInterval(async () => {
    await checkScheduledPosts();
  }, CHECK_INTERVAL);

  // Первая проверка сразу
  await checkScheduledPosts();
}

async function checkScheduledPosts() {
  try {
    const now = new Date();

    // Находим посты, которые пора публиковать
    const posts = await prisma.post.findMany({
      where: {
        status: { in: ['APPROVED', 'SCHEDULED'] },
        scheduledAt: { lte: now }
      }
    });

    for (const post of posts) {
      logger.info(`Публикуем запланированный пост: ${post.id}`);

      await addPublishJob({
        postId: post.id,
        platforms: post.platforms
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'PUBLISHING' }
      });
    }

    if (posts.length > 0) {
      logger.info(`Запланировано ${posts.length} постов на публикацию`);
    }
  } catch (error) {
    logger.error('Scheduler error:', error);
  }
}

// Парсер cron выражений (упрощённый)
export function getNextRunTime(cronExpr: string): Date {
  // Формат: "минуты часы * * *"
  const [minutes, hours] = cronExpr.split(' ').map(Number);
  
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  
  if (next <= new Date()) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}


