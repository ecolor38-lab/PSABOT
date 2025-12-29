import { Worker, Job } from 'bullmq';
import { env } from '../../config/environment.js';
import { prisma } from '../../config/database.js';
import { contentGenerator } from '../../agents/content-generator.js';
import { addImageJob } from '../queue.js';
import logger from '../../utils/logger.js';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
};

interface ContentJobData {
  taskId: string;
  platform: string;
  userPrompt: string;
  schema: object;
}

export const contentWorker = new Worker<ContentJobData>(
  'content-generation',
  async (job: Job<ContentJobData>) => {
    const { taskId, platform, userPrompt, schema } = job.data;

    try {
      logger.info('Generating content', { taskId, platform });

      // Инициализируем генератор
      await contentGenerator.initialize();

      // Генерируем контент
      const content = await contentGenerator.generate(platform as any, userPrompt, schema);

      // Сохраняем в БД
      await prisma.content.create({
        data: {
          id: taskId,
          platform,
          userPrompt,
          generatedContent: JSON.parse(JSON.stringify(content)),
          status: 'generated',
        },
      });

      // Обновляем задачу
      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'processing',
          result: { contentGenerated: true },
        },
      });

      // Добавляем задачу на генерацию изображения
      if (content.common_schema?.image_suggestion) {
        await addImageJob({
          taskId,
          imageSuggestion: content.common_schema.image_suggestion,
        });
      }

      logger.info('Content generated successfully', { taskId });
      return { success: true, content };

    } catch (error) {
      logger.error('Content generation failed', { error, taskId });

      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          attempts: { increment: 1 },
        },
      });

      throw error;
    }
  },
  { connection }
);

contentWorker.on('completed', (job) => {
  logger.info(`Content job ${job.id} completed`);
});

contentWorker.on('failed', (job, err) => {
  logger.error(`Content job ${job?.id} failed`, err);
});


