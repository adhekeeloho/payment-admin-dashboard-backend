import { Router } from 'express';
import { authRouter } from './auth';
import { dashboardRouter } from './dashboard';
import { healthRouter } from './health';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
