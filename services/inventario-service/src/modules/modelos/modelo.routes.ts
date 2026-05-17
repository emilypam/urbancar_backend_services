import { Router } from 'express';
import { ModeloController } from './modelo.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { ModeloCreateSchema, ModeloUpdateSchema } from './modelo.dto.js';

export function createModeloRouter(controller: ModeloController): Router {
  const router = Router();
  router.get('/',       controller.listAll);
  router.get('/:id',    controller.getById);
  router.post('/',      authenticate, requireAdmin, validateBody(ModeloCreateSchema),  controller.create);
  router.patch('/:id',  authenticate, requireAdmin, validateBody(ModeloUpdateSchema),  controller.update);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);
  return router;
}
