import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { healthController } from '../controllers/health.controller.js';
import { interviewRouter } from './interview.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', healthController);
apiRouter.use('/auth', authRouter);
apiRouter.use('/interviews', interviewRouter);
