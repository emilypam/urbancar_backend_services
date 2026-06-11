import { Router } from 'express';
import { MantenimientoControllerV2 } from './mantenimiento.controller.v2.js';
import { MantenimientoServiceV2 } from './mantenimiento.service.v2.js';
import { MantenimientoRepository } from '../mantenimiento.repository.js';
import { authenticate, requireAdmin } from '../../../shared/middlewares/auth.middleware.js';
import prisma from '../../../shared/database/prisma.js';

export function createMantenimientoV2Router(): Router {
  const router = Router();
  const repo   = new MantenimientoRepository(prisma);
  const svc    = new MantenimientoServiceV2(repo);
  const ctrl   = new MantenimientoControllerV2(svc);

  router.post('/',      authenticate, requireAdmin, ctrl.create);
  router.patch('/:id',  authenticate, requireAdmin, ctrl.update);

  return router;
}
