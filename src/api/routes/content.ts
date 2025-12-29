import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { z } from 'zod';

export const contentRouter = Router();

// Параметры пагинации
const querySchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
  platform: z.string().optional(),
  status: z.string().optional(),
});

// GET /api/content — список контента
contentRouter.get('/', async (req, res, next) => {
  try {
    const { page, limit, platform, status } = querySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where = {
      ...(platform && { platform }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.content.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/content/:id — конкретный контент
contentRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      return res.status(404).json({ error: 'Контент не найден' });
    }

    res.json(content);
  } catch (error) {
    next(error);
  }
});


