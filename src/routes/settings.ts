import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.systemSettings.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.status(200).json(settings);
  } catch (error) {
    next(error as Error);
  }
});

settingsRouter.patch('/', async (req, res, next) => {
  try {
    const updates = req.body as Record<string, string>;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'Body must be a key-value object' });
    }

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.systemSettings.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        }),
      ),
    );

    const rows = await prisma.systemSettings.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return res.status(200).json(settings);
  } catch (error) {
    return next(error as Error);
  }
});
