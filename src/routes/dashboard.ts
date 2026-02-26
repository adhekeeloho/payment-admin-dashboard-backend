import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

const parseDate = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildRevenueSeries = async (startDate?: Date, endDate?: Date) => {
  const payments = await prisma.transaction.findMany({
    where: {
      status: 'completed',
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      paidAt: true,
      amount: true,
    },
    orderBy: {
      paidAt: 'asc',
    },
  });

  const buckets = new Map<string, number>();
  for (const payment of payments) {
    const key = payment.paidAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
  }

  return Array.from(buckets.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));
};

dashboardRouter.get('/metrics', async (_req, res, next) => {
  try {
    const [totalRevenue, pendingPayouts] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'pending' },
      }),
    ]);

    res.status(200).json({
      totalRevenue: totalRevenue._sum.amount ?? 0,
      activeSubscriptions: 0,
      pendingPayouts: pendingPayouts._sum.amount ?? 0,
      churnRate: 0,
    });
  } catch (error) {
    next(error as Error);
  }
});

dashboardRouter.get('/revenue', async (req, res, next) => {
  try {
    const startDate = parseDate(req.query.startDate as string | undefined);
    const endDate = parseDate(req.query.endDate as string | undefined);
    const series = await buildRevenueSeries(startDate, endDate);
    res.status(200).json({ series });
  } catch (error) {
    next(error as Error);
  }
});

dashboardRouter.get('/graph', async (req, res, next) => {
  try {
    const startDate = parseDate(req.query.startDate as string | undefined);
    const endDate = parseDate(req.query.endDate as string | undefined);
    const series = await buildRevenueSeries(startDate, endDate);
    res.status(200).json({ series });
  } catch (error) {
    next(error as Error);
  }
});

dashboardRouter.get('/transactions', async (req, res, next) => {
  try {
    const startDate = parseDate(req.query.startDate as string | undefined);
    const endDate = parseDate(req.query.endDate as string | undefined);
    const status = req.query.status as 'pending' | 'completed' | 'failed' | undefined;
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);

    const where = {
      status,
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    } as const;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy: {
          paidAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.status(200).json({
      items,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    next(error as Error);
  }
});
