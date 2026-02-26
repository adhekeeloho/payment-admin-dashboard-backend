import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const payoutsRouter = Router();

payoutsRouter.use(requireAuth);

payoutsRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);
    const status = req.query.status as string | undefined;

    const where = status ? { status: status as 'pending' | 'paid' | 'failed' } : {};

    const [items, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: { customer: true },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payout.count({ where }),
    ]);

    res.status(200).json({ items, page, pageSize, total });
  } catch (error) {
    next(error as Error);
  }
});

payoutsRouter.get('/schedule', async (_req, res, next) => {
  try {
    const upcoming = await prisma.payout.findMany({
      where: {
        status: 'pending',
        scheduledAt: { gte: new Date() },
      },
      include: { customer: true },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    });

    res.status(200).json({ schedule: upcoming });
  } catch (error) {
    next(error as Error);
  }
});

payoutsRouter.post('/', async (req, res, next) => {
  try {
    const { amount, scheduledAt, customerId } = req.body as {
      amount: number;
      scheduledAt: string;
      customerId?: string;
    };

    if (!amount || !scheduledAt) {
      return res.status(400).json({ message: 'amount and scheduledAt are required' });
    }

    const payout = await prisma.payout.create({
      data: {
        amount,
        scheduledAt: new Date(scheduledAt),
        customerId: customerId ?? null,
      },
    });

    return res.status(201).json(payout);
  } catch (error) {
    return next(error as Error);
  }
});
