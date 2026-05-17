import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { RegisterSchema, LoginSchema, UpdateProfileSchema } from './auth.dto.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' } },
});

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post('/register', authLimiter, validateBody(RegisterSchema), controller.register);
  router.post('/login',    authLimiter, validateBody(LoginSchema),    controller.login);
  router.get('/me',        authenticate,                               controller.me);
  router.patch('/me',      authenticate, validateBody(UpdateProfileSchema), controller.updateMe);
  return router;
}
