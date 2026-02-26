import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const customersRouter = Router();

customersRouter.use(requireAuth);

customersRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);
    const search = req.query.search as string | undefined;

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { payments: true } } },
      }),
      prisma.customer.count({ where }),
    ]);

    res.status(200).json({ items, page, pageSize, total });
  } catch (error) {
    next(error as Error);
  }
});

customersRouter.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        payments: { orderBy: { paidAt: 'desc' }, take: 10 },
        _count: { select: { payments: true } },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    return next(error as Error);
  }
});

customersRouter.get('/:id/health', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [total, completed, failed, totalRevenue] = await Promise.all([
      prisma.transaction.count({ where: { customerId: req.params.id } }),
      prisma.transaction.count({ where: { customerId: req.params.id, status: 'completed' } }),
      prisma.transaction.count({ where: { customerId: req.params.id, status: 'failed' } }),
      prisma.transaction.aggregate({
        where: { customerId: req.params.id, status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    return res.status(200).json({
      customerId: req.params.id,
      totalTransactions: total,
      completedTransactions: completed,
      failedTransactions: failed,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (error) {
    return next(error as Error);
  }
});
