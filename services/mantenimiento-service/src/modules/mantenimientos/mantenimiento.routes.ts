import { Router } from 'express';
import { MantenimientoController } from './mantenimiento.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { MantenimientoCreateSchema, MantenimientoUpdateSchema } from './mantenimiento.dto.js';

export function createMantenimientoRouter(controller: MantenimientoController): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);

  router.get('/',    controller.listAll);
  router.get('/:id', controller.getById);
  router.post('/',   validateBody(MantenimientoCreateSchema), controller.create);
  router.patch('/:id', validateBody(MantenimientoUpdateSchema), controller.update);

  return router;
}
