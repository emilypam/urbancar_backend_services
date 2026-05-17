import { Router } from 'express';
import { KardexController } from './kardex.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import { KardexCreateSchema } from './kardex.dto.js';

export function createKardexRouter(controller: KardexController): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);

  router.get('/',                         controller.listAll);
  router.get('/vehiculo/:vehiculoId',     controller.getByVehiculo);
  router.post('/', validateBody(KardexCreateSchema), controller.create);

  return router;
}
