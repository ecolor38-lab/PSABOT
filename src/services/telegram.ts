import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../lib/prisma.js';
import { addPublishJob } from '../lib/queues.js';
import { logger } from '../lib/logger.js';

let bot: TelegramBot | null = null;

export async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN не задан');
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  // Команда /start
  bot.onText(/\/start/, (msg) => {
    bot?.sendMessage(msg.chat.id, 
      '👋 Привет! Я PSABOT — AI бот для управления соцсетями.\n\n' +
      'Здесь ты будешь получать посты на одобрение.\n\n' +
      `Твой Chat ID: \`${msg.chat.id}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // Обработка кнопок
  bot.on('callback_query', async (query) => {
    if (!query.data) return;

    const [action, postId] = query.data.split(':');
    const chatId = query.message?.chat.id;

    try {
      if (action === 'approve') {
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: String(query.from.id)
          }
        });

        await bot?.answerCallbackQuery(query.id, { text: '✅ Одобрено!' });
        await bot?.editMessageReplyMarkup(
          { inline_keyboard: [[{ text: '✅ ОДОБРЕНО', callback_data: 'done' }]] },
          { chat_id: chatId, message_id: query.message?.message_id }
        );

      } else if (action === 'publish') {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (post) {
          await addPublishJob({ postId, platforms: post.platforms });
          await bot?.answerCallbackQuery(query.id, { text: '🚀 Отправлено на публикацию!' });
        }

      } else if (action === 'reject') {
        await prisma.post.update({
          where: { id: postId },
          data: { status: 'CANCELLED' }
        });
        await bot?.answerCallbackQuery(query.id, { text: '❌ Отклонено' });
        await bot?.editMessageReplyMarkup(
          { inline_keyboard: [[{ text: '❌ ОТКЛОНЕНО', callback_data: 'done' }]] },
          { chat_id: chatId, message_id: query.message?.message_id }
        );
      }
    } catch (error) {
      logger.error('Telegram callback error:', error);
      await bot?.answerCallbackQuery(query.id, { text: 'Ошибка!' });
    }
  });

  logger.info('Telegram бот запущен');
}

export async function sendApprovalRequest(postId: string, content: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!bot || !chatId) return;

  const preview = content.length > 1000 ? content.slice(0, 1000) + '...' : content;

  await bot.sendMessage(chatId, 
    `📝 *Новый пост на одобрение*\n\n${preview}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Одобрить', callback_data: `approve:${postId}` },
            { text: '🚀 Опубликовать', callback_data: `publish:${postId}` }
          ],
          [
            { text: '❌ Отклонить', callback_data: `reject:${postId}` }
          ]
        ]
      }
    }
  );
}

export async function sendNotification(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!bot || !chatId) return;

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}


