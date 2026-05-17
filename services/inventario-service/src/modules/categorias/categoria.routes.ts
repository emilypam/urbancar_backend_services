import { Router } from 'express';
import { CategoriaController } from './categoria.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { CategoriaCreateSchema, CategoriaUpdateSchema } from './categoria.dto.js';

export function createCategoriaRouter(controller: CategoriaController): Router {
  const router = Router();
  router.get('/',       controller.listAll);
  router.get('/:id',    controller.getById);
  router.post('/',      authenticate, requireAdmin, validateBody(CategoriaCreateSchema),  controller.create);
  router.patch('/:id',  authenticate, requireAdmin, validateBody(CategoriaUpdateSchema),  controller.update);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);
  return router;
}
