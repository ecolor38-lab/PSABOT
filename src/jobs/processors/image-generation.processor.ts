import { Worker, Job } from 'bullmq';
import { env } from '../../config/environment.js';
import { prisma } from '../../config/database.js';
import { pollinationsService } from '../../services/image/pollinations.service.js';
import { addApprovalJob } from '../queue.js';
import logger from '../../utils/logger.js';

// Импортируем storage сервисы когда они будут готовы
// import { googleDriveService } from '../../services/storage/google-drive.service.js';
// import { imgbbService } from '../../services/storage/imgbb.service.js';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
};

interface ImageJobData {
  taskId: string;
  imageSuggestion: string;
}

export const imageWorker = new Worker<ImageJobData>(
  'image-generation',
  async (job: Job<ImageJobData>) => {
    const { taskId, imageSuggestion } = job.data;

    try {
      logger.info('Generating image', { taskId, prompt: imageSuggestion.slice(0, 50) });

      // Генерируем изображение
      const imageBuffer = await pollinationsService.generateImage(imageSuggestion);

      // TODO: Загружаем в Google Drive
      // const googleDriveId = await googleDriveService.upload(imageBuffer, `${taskId}.png`);

      // TODO: Загружаем в ImgBB для публичного URL
      // const imgbbUrl = await imgbbService.upload(imageBuffer);

      // Пока используем прямой URL от Pollinations
      const imageUrl = pollinationsService.getImageUrl(imageSuggestion);

      // Обновляем контент
      await prisma.content.update({
        where: { id: taskId },
        data: {
          imageUrl,
          // googleDriveId,
          status: 'pending',
        },
      });

      // Добавляем задачу на отправку одобрения
      await addApprovalJob({ contentId: taskId });

      logger.info('Image generated and saved', { taskId });
      return { success: true, imageUrl };

    } catch (error) {
      logger.error('Image generation failed', { error, taskId });
      throw error;
    }
  },
  { connection }
);

imageWorker.on('completed', (job) => {
  logger.info(`Image job ${job.id} completed`);
});

imageWorker.on('failed', (job, err) => {
  logger.error(`Image job ${job?.id} failed`, err);
});


