import { Router } from 'express';
import { PagoController } from './pago.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { PagoCreateSchema, PagoUpdateSchema } from './pago.dto.js';

export function createPagoRouter(controller: PagoController): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/',    controller.listAll);
  router.get('/:id', controller.getById);

  router.post('/',
    validateBody(PagoCreateSchema),
    controller.create,
  );

  router.patch('/:id',
    requireAdmin,
    validateBody(PagoUpdateSchema),
    controller.update,
  );

  return router;
}
