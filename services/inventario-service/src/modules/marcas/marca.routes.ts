import { Router } from 'express';
import { MarcaController } from './marca.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { MarcaCreateSchema, MarcaUpdateSchema } from './marca.dto.js';

export function createMarcaRouter(controller: MarcaController): Router {
  const router = Router();
  router.get('/',       controller.listAll);
  router.get('/:id',    controller.getById);
  router.post('/',      authenticate, requireAdmin, validateBody(MarcaCreateSchema),  controller.create);
  router.patch('/:id',  authenticate, requireAdmin, validateBody(MarcaUpdateSchema),  controller.update);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);
  return router;
}
