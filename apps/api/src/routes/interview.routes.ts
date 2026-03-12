import { Router } from 'express';
import {
  interviewAnalyticsController,
  listSessionsController,
  getResultController,
  getSessionController,
  predictQuestionsController,
  scanResumeController,
  startInterviewController,
  submitAnswerController,
  terminateInterviewController
} from '../controllers/interview.controller.js';
import multer from 'multer';

export const interviewRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });

interviewRouter.post('/resume/scan', upload.single('resume'), scanResumeController);
interviewRouter.post('/intelligence/predict', predictQuestionsController);
interviewRouter.post('/start', startInterviewController);
interviewRouter.get('/', listSessionsController);
interviewRouter.get('/analytics/overview', interviewAnalyticsController);
interviewRouter.post('/:sessionId/answer', submitAnswerController);
interviewRouter.post('/:sessionId/terminate', terminateInterviewController);
interviewRouter.get('/:sessionId', getSessionController);
interviewRouter.get('/:sessionId/result', getResultController);
