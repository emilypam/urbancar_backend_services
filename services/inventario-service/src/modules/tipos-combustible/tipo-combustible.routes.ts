import { Router } from 'express';
import { TipoCombustibleController } from './tipo-combustible.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { TipoCombustibleCreateSchema } from './tipo-combustible.dto.js';

export function createTipoCombustibleRouter(controller: TipoCombustibleController): Router {
  const router = Router();
  router.get('/',       controller.listAll);
  router.post('/',      authenticate, requireAdmin, validateBody(TipoCombustibleCreateSchema), controller.create);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);
  return router;
}
