import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { addPublishJob, addNotifyJob } from '../lib/queues.js';
import { z } from 'zod';

export const postsRouter = Router();

// Схема валидации
const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  platforms: z.array(z.enum(['TWITTER', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'THREADS', 'YOUTUBE'])),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().optional(),
  sendForApproval: z.boolean().optional()
});

// Получить все посты
postsRouter.get('/', async (req, res) => {
  const { status, limit = 50 } = req.query;
  
  const posts = await prisma.post.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    include: { publications: true }
  });

  res.json(posts);
});

// Получить пост по ID
postsRouter.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { publications: true, account: true }
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json(post);
});

// Создать пост
postsRouter.post('/', async (req, res) => {
  try {
    const data = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        content: data.content,
        platforms: data.platforms,
        mediaUrls: data.mediaUrls || [],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: data.sendForApproval ? 'PENDING_APPROVAL' : 'DRAFT'
      }
    });

    // Если нужно одобрение — отправляем в Telegram
    if (data.sendForApproval) {
      await addNotifyJob({
        type: 'approval',
        postId: post.id,
        message: `Новый пост на одобрение:\n\n${post.content.slice(0, 500)}...`
      });
    }

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});

// Одобрить пост
postsRouter.post('/:id/approve', async (req, res) => {
  const { approvedBy } = req.body;

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy
    }
  });

  res.json(post);
});

// Опубликовать пост
postsRouter.post('/:id/publish', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id }
  });

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Ставим в очередь на публикацию
  await addPublishJob({
    postId: post.id,
    platforms: post.platforms
  });

  await prisma.post.update({
    where: { id: post.id },
    data: { status: 'PUBLISHING' }
  });

  res.json({ message: 'Post queued for publishing', postId: post.id });
});

// Удалить пост
postsRouter.delete('/:id', async (req, res) => {
  await prisma.post.delete({
    where: { id: req.params.id }
  });

  res.json({ message: 'Post deleted' });
});


