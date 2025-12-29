import logger from '../utils/logger.js';

// Импортируем воркеры
import { contentWorker } from './processors/content-generation.processor.js';
import { imageWorker } from './processors/image-generation.processor.js';
// import { approvalWorker } from './processors/approval.processor.js';
// import { publishWorker } from './processors/publishing.processor.js';

export async function startWorkers(): Promise<void> {
  logger.info('Starting BullMQ workers...');

  // Воркеры автоматически запускаются при импорте
  logger.info('✅ Content generation worker started');
  logger.info('✅ Image generation worker started');
  // logger.info('✅ Approval worker started');
  // logger.info('✅ Publishing worker started');

  logger.info('All workers started successfully');
}

export async function stopWorkers(): Promise<void> {
  logger.info('Stopping workers...');
  
  await contentWorker.close();
  await imageWorker.close();
  // await approvalWorker.close();
  // await publishWorker.close();

  logger.info('All workers stopped');
}


