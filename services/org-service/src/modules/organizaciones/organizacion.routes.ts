import { Router } from 'express';
import { OrganizacionController } from './organizacion.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import {
  EmpresaCreateSchema, EmpresaUpdateSchema,
  AgenciaCreateSchema, AgenciaUpdateSchema,
} from './organizacion.dto.js';

export function createOrganizacionRouter(controller: OrganizacionController): Router {
  const router = Router();

  // ── Empresas ──────────────────────────────────────────────────────────────────
  router.get('/empresas',     controller.listEmpresas);
  router.get('/empresas/:id', controller.getEmpresaById);
  router.post('/empresas',    authenticate, requireAdmin, validateBody(EmpresaCreateSchema),  controller.createEmpresa);
  router.patch('/empresas/:id', authenticate, requireAdmin, validateBody(EmpresaUpdateSchema), controller.updateEmpresa);
  router.delete('/empresas/:id', authenticate, requireAdmin, controller.deleteEmpresa);

  // ── Agencias ──────────────────────────────────────────────────────────────────
  router.get('/agencias',     controller.listAgencias);
  router.get('/agencias/:id', controller.getAgenciaById);
  router.post('/agencias',    authenticate, requireAdmin, validateBody(AgenciaCreateSchema),  controller.createAgencia);
  router.patch('/agencias/:id', authenticate, requireAdmin, validateBody(AgenciaUpdateSchema), controller.updateAgencia);
  router.delete('/agencias/:id', authenticate, requireAdmin, controller.deleteAgencia);

  return router;
}
