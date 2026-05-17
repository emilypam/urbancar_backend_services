import { Router } from 'express';
import { TipoTransmisionController } from './tipo-transmision.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { TipoTransmisionCreateSchema } from './tipo-transmision.dto.js';

export function createTipoTransmisionRouter(controller: TipoTransmisionController): Router {
  const router = Router();
  router.get('/',       controller.listAll);
  router.post('/',      authenticate, requireAdmin, validateBody(TipoTransmisionCreateSchema), controller.create);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);
  return router;
}
