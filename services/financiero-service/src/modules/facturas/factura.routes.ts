import { Router } from 'express';
import { FacturaController } from './factura.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { FacturaCreateSchema } from './factura.dto.js';

export function createFacturaRouter(controller: FacturaController): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/',    controller.listAll);
  router.get('/:id', controller.getById);

  router.post('/',
    requireAdmin,
    validateBody(FacturaCreateSchema),
    controller.create,
  );

  return router;
}
