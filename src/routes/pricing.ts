import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const pricingRouter = Router();

pricingRouter.use(requireAuth);

pricingRouter.get('/plans', async (_req, res, next) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: { price: 'asc' },
    });
    res.status(200).json({ plans });
  } catch (error) {
    next(error as Error);
  }
});

pricingRouter.get('/plans/:id', async (req, res, next) => {
  try {
    const plan = await prisma.pricingPlan.findUnique({ where: { id: req.params.id } });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    return res.status(200).json(plan);
  } catch (error) {
    return next(error as Error);
  }
});

pricingRouter.post('/plans', async (req, res, next) => {
  try {
    const { name, description, price, currency, interval, features, isActive } = req.body as {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      interval?: string;
      features?: string[];
      isActive?: boolean;
    };

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'name and price are required' });
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        name,
        description,
        price,
        currency: currency ?? 'USD',
        interval: interval ?? 'month',
        features: features ?? [],
        isActive: isActive ?? true,
      },
    });

    return res.status(201).json(plan);
  } catch (error) {
    return next(error as Error);
  }
});

pricingRouter.patch('/plans/:id', async (req, res, next) => {
  try {
    const existing = await prisma.pricingPlan.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const plan = await prisma.pricingPlan.update({
      where: { id: req.params.id },
      data: req.body as object,
    });

    return res.status(200).json(plan);
  } catch (error) {
    return next(error as Error);
  }
});

pricingRouter.delete('/plans/:id', async (req, res, next) => {
  try {
    const existing = await prisma.pricingPlan.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    await prisma.pricingPlan.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error as Error);
  }
});
