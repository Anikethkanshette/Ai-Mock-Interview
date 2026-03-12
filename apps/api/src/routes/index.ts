import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { interviewRouter } from './interview.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', healthController);
apiRouter.use('/interviews', interviewRouter);
