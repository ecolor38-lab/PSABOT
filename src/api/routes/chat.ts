import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { addContentJob } from '../../jobs/queue.js';
import { routerAgent } from '../../agents/router-agent.js';

export const chatRouter = Router();

// Схема валидации
const chatSchema = z.object({
  message: z.string().min(1, 'Сообщение обязательно'),
});

// POST /api/chat — создать задачу генерации
chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = chatSchema.parse(req.body);

    // Определяем платформу через AI
    logger.info('Routing message...', { message: message.slice(0, 50) });
    const routeResult = await routerAgent.route(message);
    logger.info('Route result', routeResult);

    // Создаём задачу в БД
    const task = await prisma.task.create({
      data: {
        type: 'generate',
        status: 'pending',
        data: { 
          message,
          platform: routeResult.platform,
          confidence: routeResult.confidence
        },
      },
    });

    // Добавляем в очередь BullMQ
    await addContentJob({
      taskId: task.id,
      platform: routeResult.platform,
      userPrompt: message,
      schema: getSchemaForPlatform(routeResult.platform),
    });

    logger.info(`Задача создана: ${task.id}`, { platform: routeResult.platform });

    res.status(201).json({
      taskId: task.id,
      status: task.status,
      platform: routeResult.platform,
      confidence: routeResult.confidence,
      message: 'Задача создана, контент генерируется...',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/:taskId — статус задачи
chatRouter.get('/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Если задача завершена — ищем контент
    let content = null;
    if (task.status === 'completed' && task.result) {
      const result = task.result as { contentId?: string };
      if (result.contentId) {
        content = await prisma.content.findUnique({
          where: { id: result.contentId },
        });
      }
    }

    res.json({
      taskId: task.id,
      type: task.type,
      status: task.status,
      data: task.data,
      result: task.result,
      error: task.error,
      attempts: task.attempts,
      content,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    });
  } catch (error) {
    next(error);
  }
});

// Схемы для разных платформ
function getSchemaForPlatform(platform: string) {
  const schemas: Record<string, object> = {
    twitter: {
      root_schema: { name: 'string', description: 'string' },
      common_schema: { hashtags: ['string'], image_suggestion: 'string' },
      schema: { post: 'string (max 280 chars)', character_limit: 280 }
    },
    instagram: {
      root_schema: { name: 'string', description: 'string' },
      common_schema: { hashtags: ['string (5-10 hashtags)'], image_suggestion: 'string' },
      schema: { caption: 'string', emojis: ['string'], call_to_action: 'string' }
    },
    facebook: {
      root_schema: { name: 'string', description: 'string' },
      common_schema: { hashtags: ['string'], image_suggestion: 'string' },
      schema: { post: 'string', call_to_action: 'string' }
    },
    linkedin: {
      root_schema: { name: 'string', description: 'string' },
      common_schema: { hashtags: ['string'], image_suggestion: 'string' },
      schema: { post: 'string (professional tone)', call_to_action: 'string' }
    },
    threads: {
      root_schema: { name: 'string', description: 'string' },
      common_schema: { hashtags: ['string'], image_suggestion: 'string' },
      schema: { post: 'string (max 500 chars)', character_limit: 500 }
    },
    youtube_short: {
      root_schema: { name: 'string', description: 'string' },
      common_schema: { hashtags: ['string'], image_suggestion: 'string' },
      schema: { title: 'string', description: 'string' }
    }
  };

  return schemas[platform] || schemas.twitter;
}
