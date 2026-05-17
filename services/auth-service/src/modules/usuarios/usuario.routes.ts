import { Router } from 'express';
import { UsuarioController } from './usuario.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { UpdateUsuarioSchema } from './usuario.dto.js';

export function createUsuarioRouter(controller: UsuarioController): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);

  router.get('/',       controller.listAll);
  router.get('/:id',    controller.getById);
  router.patch('/:id',  validateBody(UpdateUsuarioSchema), controller.update);
  router.delete('/:id', controller.deactivate);

  return router;
}
