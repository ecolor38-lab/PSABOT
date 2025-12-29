import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { env } from '../../config/environment.js';
import logger from '../../utils/logger.js';
// import { addJob } from '../../jobs/queue.js';

export const approvalRouter = Router();

// GET /api/approve/:token — одобрить контент
approvalRouter.get('/approve/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const content = await prisma.content.findUnique({
      where: { approvalToken: token },
    });

    if (!content) {
      return res.status(404).send(renderPage('Ошибка', 'Контент не найден или ссылка устарела.', 'error'));
    }

    if (content.status === 'published') {
      return res.send(renderPage('Уже опубликовано', 'Этот контент уже был опубликован.', 'info'));
    }

    if (content.status === 'approved') {
      return res.send(renderPage('Уже одобрено', 'Этот контент уже был одобрен и ожидает публикации.', 'info'));
    }

    // Проверяем таймаут
    const timeoutMs = env.APPROVAL_TIMEOUT_MINUTES * 60 * 1000;
    const isExpired = Date.now() - content.createdAt.getTime() > timeoutMs;

    if (isExpired) {
      await prisma.content.update({
        where: { id: content.id },
        data: { status: 'cancelled' },
      });
      return res.status(410).send(renderPage('Истекло', 'Время на одобрение истекло.', 'error'));
    }

    // Одобряем
    await prisma.content.update({
      where: { id: content.id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    // Создаём задачу на публикацию
    await prisma.task.create({
      data: {
        type: 'publish',
        status: 'pending',
        data: { contentId: content.id },
      },
    });

    // Добавляем в очередь (раскомментировать после создания jobs)
    // await addJob('publish', { contentId: content.id });

    logger.info(`Контент одобрен: ${content.id}`);

    res.send(renderPage('Одобрено! ✅', 'Контент одобрен и будет опубликован в ближайшее время.', 'success'));
  } catch (error) {
    next(error);
  }
});

// GET /api/reject/:token — отклонить контент
approvalRouter.get('/reject/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const content = await prisma.content.findUnique({
      where: { approvalToken: token },
    });

    if (!content) {
      return res.status(404).send(renderPage('Ошибка', 'Контент не найден.', 'error'));
    }

    if (content.status !== 'pending') {
      return res.send(renderPage('Невозможно', 'Этот контент уже обработан.', 'info'));
    }

    await prisma.content.update({
      where: { id: content.id },
      data: { status: 'cancelled' },
    });

    logger.info(`Контент отклонён: ${content.id}`);

    res.send(renderPage('Отклонено', 'Контент отклонён и не будет опубликован.', 'info'));
  } catch (error) {
    next(error);
  }
});

// HTML страница для ответа
function renderPage(title: string, message: string, type: 'success' | 'error' | 'info'): string {
  const colors = {
    success: { bg: '#10b981', icon: '✅' },
    error: { bg: '#ef4444', icon: '❌' },
    info: { bg: '#3b82f6', icon: 'ℹ️' },
  };
  const { bg, icon } = colors[type];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - PSABOT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      margin-bottom: 10px;
      color: ${bg};
    }
    .message {
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1 class="title">${title}</h1>
    <p class="message">${message}</p>
  </div>
</body>
</html>`;
}

