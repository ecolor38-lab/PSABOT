import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../../config/environment.js';
import logger from '../../utils/logger.js';

// Кастомная ошибка API
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Middleware обработки ошибок
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Логируем ошибку
  logger.error(`${req.method} ${req.path}`, err);

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Ошибка валидации',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Кастомная API ошибка
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Prisma ошибки
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'Ошибка базы данных',
    });
    return;
  }

  // Общая ошибка
  res.status(500).json({
    error: env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message,
  });
}

