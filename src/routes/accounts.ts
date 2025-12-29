import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export const accountsRouter = Router();

const createAccountSchema = z.object({
  platform: z.enum(['TWITTER', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'THREADS', 'YOUTUBE']),
  accountId: z.string(),
  accountName: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional()
});

// Получить все аккаунты
accountsRouter.get('/', async (req, res) => {
  const accounts = await prisma.socialAccount.findMany({
    select: {
      id: true,
      platform: true,
      accountName: true,
      isActive: true,
      createdAt: true
    }
  });

  res.json(accounts);
});

// Добавить аккаунт
accountsRouter.post('/', async (req, res) => {
  try {
    const data = createAccountSchema.parse(req.body);

    const account = await prisma.socialAccount.create({
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });

    res.status(201).json({ 
      id: account.id, 
      platform: account.platform,
      accountName: account.accountName 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Деактивировать аккаунт
accountsRouter.patch('/:id/deactivate', async (req, res) => {
  const account = await prisma.socialAccount.update({
    where: { id: req.params.id },
    data: { isActive: false }
  });

  res.json({ message: 'Account deactivated', id: account.id });
});

// Удалить аккаунт
accountsRouter.delete('/:id', async (req, res) => {
  await prisma.socialAccount.delete({
    where: { id: req.params.id }
  });

  res.json({ message: 'Account deleted' });
});


