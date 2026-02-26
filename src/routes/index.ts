import { Router } from 'express';
import { authRouter } from './auth';
import { dashboardRouter } from './dashboard';
import { healthRouter } from './health';
import { customersRouter } from './customers';
import { analyticsRouter } from './analytics';
import { payoutsRouter } from './payouts';
import { supportRouter } from './support';
import { settingsRouter } from './settings';
import { approvalsRouter } from './approvals';
import { pricingRouter } from './pricing';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/payouts', payoutsRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/approvals', approvalsRouter);
apiRouter.use('/pricing', pricingRouter);
