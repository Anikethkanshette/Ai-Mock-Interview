import { Router } from 'express';
import {
  loginAuthController,
  logoutAuthController,
  meAuthController,
  registerAuthController,
  updateProfileAuthController
} from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', registerAuthController);
authRouter.post('/login', loginAuthController);
authRouter.get('/me', meAuthController);
authRouter.patch('/profile', updateProfileAuthController);
authRouter.post('/logout', logoutAuthController);
