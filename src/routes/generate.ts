import { Router } from 'express';
import { z } from 'zod';
import { generateContent } from '../services/ai.js';
import { prisma } from '../lib/prisma.js';
import { addNotifyJob } from '../lib/queues.js';

export const generateRouter = Router();

const generateSchema = z.object({
  prompt: z.string().min(10),
  platforms: z.array(z.enum(['TWITTER', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'THREADS', 'YOUTUBE'])),
  tone: z.enum(['professional', 'casual', 'funny', 'inspiring']).optional(),
  language: z.enum(['ru', 'en']).default('ru'),
  sendForApproval: z.boolean().default(true)
});

// Сгенерировать контент через AI
generateRouter.post('/', async (req, res) => {
  try {
    const data = generateSchema.parse(req.body);

    // Генерируем контент
    const content = await generateContent({
      prompt: data.prompt,
      platforms: data.platforms,
      tone: data.tone || 'professional',
      language: data.language
    });

    // Создаём пост
    const post = await prisma.post.create({
      data: {
        content,
        platforms: data.platforms,
        aiGenerated: true,
        aiPrompt: data.prompt,
        status: data.sendForApproval ? 'PENDING_APPROVAL' : 'DRAFT'
      }
    });

    // Отправляем на одобрение
    if (data.sendForApproval) {
      await addNotifyJob({
        type: 'approval',
        postId: post.id,
        message: `🤖 AI сгенерировал пост:\n\n${content.slice(0, 500)}${content.length > 500 ? '...' : ''}`
      });
    }

    res.json({ post, content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Улучшить существующий текст
generateRouter.post('/improve', async (req, res) => {
  const { text, instruction } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const improved = await generateContent({
    prompt: `Улучши этот текст для соцсетей. ${instruction || ''}\n\nТекст:\n${text}`,
    platforms: ['TWITTER'],
    tone: 'professional',
    language: 'ru'
  });

  res.json({ original: text, improved });
});


