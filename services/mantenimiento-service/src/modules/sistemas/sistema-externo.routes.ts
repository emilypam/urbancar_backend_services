import { Router } from 'express';
import { SistemaExternoController } from './sistema-externo.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { SistemaExternoCreateSchema, SistemaExternoUpdateSchema } from './sistema-externo.dto.js';

export function createSistemaExternoRouter(controller: SistemaExternoController): Router {
  const router = Router();

  router.get('/',    authenticate, controller.listAll);
  router.get('/:id', authenticate, controller.getById);

  router.post('/',   authenticate, requireAdmin, validateBody(SistemaExternoCreateSchema), controller.create);
  router.patch('/:id', authenticate, requireAdmin, validateBody(SistemaExternoUpdateSchema), controller.update);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);

  return router;
}
