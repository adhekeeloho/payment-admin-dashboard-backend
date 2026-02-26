import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const supportRouter = Router();

supportRouter.use(requireAuth);

supportRouter.get('/threads', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);
    const status = req.query.status as 'open' | 'closed' | undefined;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.supportThread.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { messages: true } } },
      }),
      prisma.supportThread.count({ where }),
    ]);

    res.status(200).json({ items, page, pageSize, total });
  } catch (error) {
    next(error as Error);
  }
});

supportRouter.get('/threads/:id', async (req, res, next) => {
  try {
    const thread = await prisma.supportThread.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    return res.status(200).json(thread);
  } catch (error) {
    return next(error as Error);
  }
});

supportRouter.post('/threads/:id/messages', async (req, res, next) => {
  try {
    const { content, senderType } = req.body as {
      content: string;
      senderType: 'admin' | 'customer';
    };

    if (!content || !senderType) {
      return res.status(400).json({ message: 'content and senderType are required' });
    }

    const thread = await prisma.supportThread.findUnique({ where: { id: req.params.id } });
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const message = await prisma.supportMessage.create({
      data: { threadId: req.params.id, content, senderType },
    });

    await prisma.supportThread.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json(message);
  } catch (error) {
    return next(error as Error);
  }
});
