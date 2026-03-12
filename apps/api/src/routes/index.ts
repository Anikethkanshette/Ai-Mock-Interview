import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

export const apiRouter = Router();

apiRouter.get('/health', healthController);
