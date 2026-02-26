import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get('/segments', async (_req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: { select: { payments: true } },
        payments: {
          where: { status: 'completed' },
          select: { amount: true },
        },
      },
    });

    let highValue = 0;
    let regular = 0;
    let inactive = 0;
    let newCustomers = 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const c of customers) {
      const totalSpend = c.payments.reduce((sum, p) => sum + p.amount, 0);
      const txCount = c._count.payments;

      if (c.createdAt > thirtyDaysAgo && txCount === 0) {
        newCustomers++;
      } else if (txCount === 0) {
        inactive++;
      } else if (totalSpend >= 1000) {
        highValue++;
      } else {
        regular++;
      }
    }

    res.status(200).json({
      segments: [
        { label: 'High Value', count: highValue },
        { label: 'Regular', count: regular },
        { label: 'New', count: newCustomers },
        { label: 'Inactive', count: inactive },
      ],
      total: customers.length,
    });
  } catch (error) {
    next(error as Error);
  }
});
