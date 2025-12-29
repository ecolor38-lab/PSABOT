import { Router } from 'express';
import { logger } from '../lib/logger.js';

export const webhooksRouter = Router();

// Webhook для Telegram (callback кнопок)
webhooksRouter.post('/telegram', async (req, res) => {
  try {
    // Telegram отправляет updates сюда
    const update = req.body;
    logger.debug('Telegram webhook:', update);
    
    // Обработка происходит в telegram.ts через polling
    res.sendStatus(200);
  } catch (error) {
    logger.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

// Webhook для OAuth callback
webhooksRouter.get('/oauth/:platform/callback', async (req, res) => {
  const { platform } = req.params;
  const { code, state } = req.query;

  logger.info(`OAuth callback for ${platform}`, { code: !!code, state });

  // TODO: Обработать OAuth токен и сохранить в базу
  res.send(`
    <html>
      <body>
        <h1>Авторизация успешна!</h1>
        <p>Платформа: ${platform}</p>
        <p>Можете закрыть это окно.</p>
      </body>
    </html>
  `);
});


