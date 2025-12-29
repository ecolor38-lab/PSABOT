import { Worker } from 'bullmq';
import { createRedisConnection } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { generateContent } from '../services/ai.js';
import { publishToAllPlatforms, Platform } from '../services/publishers/index.js';
import { sendApprovalRequest, sendNotification } from '../services/telegram.js';

const connection = createRedisConnection();

// Воркер генерации контента
const generateWorker = new Worker('generate', async (job) => {
  const { prompt, platforms, templateId } = job.data;
  
  logger.info(`Генерируем контент: ${prompt.slice(0, 50)}...`);

  const content = await generateContent({
    prompt,
    platforms,
    tone: 'professional',
    language: 'ru'
  });

  // Создаём пост
  const post = await prisma.post.create({
    data: {
      content,
      platforms,
      aiGenerated: true,
      aiPrompt: prompt,
      status: 'PENDING_APPROVAL'
    }
  });

  // Отправляем на одобрение
  await sendApprovalRequest(post.id, content);

  return { postId: post.id, content };
}, { connection });

// Воркер публикации
const publishWorker = new Worker('publish', async (job) => {
  const { postId, platforms } = job.data;

  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new Error(`Пост ${postId} не найден`);
  }

  logger.info(`Публикуем пост ${postId} на ${platforms.join(', ')}`);

  // Публикуем на все платформы
  const results = await publishToAllPlatforms(
    platforms as Platform[],
    post.content,
    post.mediaUrls
  );

  // Сохраняем результаты
  for (const result of results) {
    await prisma.publication.upsert({
      where: {
        postId_platform: {
          postId: post.id,
          platform: result.platform
        }
      },
      create: {
        postId: post.id,
        platform: result.platform,
        status: result.success ? 'SUCCESS' : 'FAILED',
        externalId: result.externalId,
        url: result.url,
        errorMessage: result.error,
        publishedAt: result.success ? new Date() : null
      },
      update: {
        status: result.success ? 'SUCCESS' : 'FAILED',
        externalId: result.externalId,
        url: result.url,
        errorMessage: result.error,
        publishedAt: result.success ? new Date() : null
      }
    });
  }

  // Обновляем статус поста
  const allSuccess = results.every(r => r.success);
  const anySuccess = results.some(r => r.success);

  await prisma.post.update({
    where: { id: post.id },
    data: {
      status: allSuccess ? 'PUBLISHED' : anySuccess ? 'PUBLISHED' : 'FAILED',
      publishedAt: anySuccess ? new Date() : null,
      errorMessage: allSuccess ? null : results.filter(r => !r.success).map(r => r.error).join('; ')
    }
  });

  // Уведомляем
  const successPlatforms = results.filter(r => r.success).map(r => r.platform);
  const failedPlatforms = results.filter(r => !r.success).map(r => `${r.platform}: ${r.error}`);

  let message = `📤 Пост опубликован!\n\n`;
  if (successPlatforms.length > 0) {
    message += `✅ Успешно: ${successPlatforms.join(', ')}\n`;
  }
  if (failedPlatforms.length > 0) {
    message += `❌ Ошибки:\n${failedPlatforms.join('\n')}`;
  }

  await sendNotification(message);

  return { postId, results };
}, { connection });

// Воркер уведомлений
const notifyWorker = new Worker('notify', async (job) => {
  const { type, postId, message } = job.data;

  if (type === 'approval') {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post) {
      await sendApprovalRequest(postId, post.content);
    }
  } else {
    await sendNotification(message);
  }

  return { sent: true };
}, { connection });

// Обработка ошибок
generateWorker.on('failed', (job, err) => {
  logger.error(`Generate job ${job?.id} failed:`, err);
});

publishWorker.on('failed', (job, err) => {
  logger.error(`Publish job ${job?.id} failed:`, err);
});

notifyWorker.on('failed', (job, err) => {
  logger.error(`Notify job ${job?.id} failed:`, err);
});

export async function startWorkers() {
  logger.info('BullMQ воркеры инициализированы');
}


