import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger.js';

/**
 * Middleware для логирования запросов
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // После завершения ответа
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `${method} ${originalUrl} ${statusCode} ${duration}ms`);
  });

  next();
}

