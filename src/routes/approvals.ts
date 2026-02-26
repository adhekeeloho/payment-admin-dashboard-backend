import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

export const approvalsRouter = Router();

approvalsRouter.use(requireAuth);

approvalsRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.approval.count({ where }),
    ]);

    res.status(200).json({ items, page, pageSize, total });
  } catch (error) {
    next(error as Error);
  }
});

approvalsRouter.post('/:id/approve', async (req, res, next) => {
  try {
    const approval = await prisma.approval.findUnique({ where: { id: req.params.id } });

    if (!approval) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ message: 'Approval is not pending' });
    }

    const updated = await prisma.approval.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        reviewedBy: req.user?.sub,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'approval.approved',
        performedBy: req.user?.sub ?? 'unknown',
        details: { approvalId: req.params.id, type: approval.type },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    return next(error as Error);
  }
});

approvalsRouter.post('/:id/reject', async (req, res, next) => {
  try {
    const approval = await prisma.approval.findUnique({ where: { id: req.params.id } });

    if (!approval) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ message: 'Approval is not pending' });
    }

    const updated = await prisma.approval.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        reviewedBy: req.user?.sub,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'approval.rejected',
        performedBy: req.user?.sub ?? 'unknown',
        details: { approvalId: req.params.id, type: approval.type },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    return next(error as Error);
  }
});

approvalsRouter.get('/audit-log', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count(),
    ]);

    res.status(200).json({ items, page, pageSize, total });
  } catch (error) {
    next(error as Error);
  }
});
