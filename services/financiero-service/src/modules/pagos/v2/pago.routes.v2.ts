import { Router } from 'express';
import { PagoControllerV2 } from './pago.controller.v2.js';
import { PagoServiceV2 } from './pago.service.v2.js';
import { PagoRepository } from '../pago.repository.js';
import { authenticate, requireAdmin } from '../../../shared/middlewares/auth.middleware.js';
import prisma from '../../../shared/database/prisma.js';

export function createPagoV2Router(): Router {
  const router = Router();
  const repo   = new PagoRepository(prisma);
  const svc    = new PagoServiceV2(repo);
  const ctrl   = new PagoControllerV2(svc);

  router.post('/',             authenticate, requireAdmin, ctrl.create);
  router.post('/:id/fallido',  authenticate, requireAdmin, ctrl.marcarFallido);

  return router;
}
