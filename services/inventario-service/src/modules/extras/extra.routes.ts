import { Router } from 'express';
import { ExtraController } from './extra.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { ExtraCreateSchema, ExtraUpdateSchema } from './extra.dto.js';

export function createExtraRouter(controller: ExtraController): Router {
  const router = Router();
  router.get('/',       controller.listAll);
  router.get('/:id',    controller.getById);
  router.post('/',      authenticate, requireAdmin, validateBody(ExtraCreateSchema),  controller.create);
  router.patch('/:id',  authenticate, requireAdmin, validateBody(ExtraUpdateSchema),  controller.update);
  router.delete('/:id', authenticate, requireAdmin, controller.delete);
  return router;
}
