import { Router } from 'express';
import { VehiculoController } from './vehiculo.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { VehiculoCreateSchema, VehiculoUpdateSchema } from './vehiculo.dto.js';

export function createVehiculoRouter(controller: VehiculoController): Router {
  const router = Router();

  router.get('/marketplace', controller.marketplace);
  router.get('/search',      controller.search);
  router.get('/',            controller.listAll);

  // Integración Booking: consulta de disponibilidad pública
  router.get('/:id/disponibilidad', controller.checkDisponibilidad);
  router.get('/:id',         controller.getById);

  router.post('/',
    authenticate, requireAdmin,
    validateBody(VehiculoCreateSchema),
    controller.create,
  );

  router.patch('/:id',
    authenticate, requireAdmin,
    validateBody(VehiculoUpdateSchema),
    controller.update,
  );

  router.delete('/:id',
    authenticate, requireAdmin,
    controller.delete,
  );

  return router;
}
