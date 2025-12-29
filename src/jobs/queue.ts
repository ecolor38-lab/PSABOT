import { Queue } from 'bullmq';
import { env } from '../config/environment.js';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
};

// Очередь генерации контента
export const contentQueue = new Queue('content-generation', { connection });

// Очередь генерации изображений
export const imageQueue = new Queue('image-generation', { connection });

// Очередь одобрения
export const approvalQueue = new Queue('approval', { connection });

// Очередь публикации
export const publishQueue = new Queue('publishing', { connection });

// Хелперы для добавления задач
export async function addContentJob(data: { taskId: string; platform: string; userPrompt: string; schema: object }) {
  return contentQueue.add('generate', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function addImageJob(data: { taskId: string; imageSuggestion: string }) {
  return imageQueue.add('generate', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function addApprovalJob(data: { contentId: string }) {
  return approvalQueue.add('send', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function addPublishJob(data: { contentId: string }) {
  return publishQueue.add('publish', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
  });
}


