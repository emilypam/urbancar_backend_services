import { Router } from 'express';
import { UbicacionController } from './ubicacion.controller.js';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../shared/middlewares/validate.middleware.js';
import {
  ProvinciaCreateSchema, ProvinciaUpdateSchema,
  CiudadCreateSchema, CiudadUpdateSchema,
} from './ubicacion.dto.js';

export function createUbicacionRouter(controller: UbicacionController): Router {
  const router = Router();

  // ── Provincias ────────────────────────────────────────────────────────────────
  router.get('/provincias',     controller.listProvincias);
  router.get('/provincias/:id', controller.getProvinciaById);
  router.post('/provincias',    authenticate, requireAdmin, validateBody(ProvinciaCreateSchema),  controller.createProvincia);
  router.patch('/provincias/:id', authenticate, requireAdmin, validateBody(ProvinciaUpdateSchema), controller.updateProvincia);
  router.delete('/provincias/:id', authenticate, requireAdmin, controller.deleteProvincia);

  // ── Ciudades ──────────────────────────────────────────────────────────────────
  router.get('/ciudades',     controller.listCiudades);
  router.get('/ciudades/:id', controller.getCiudadById);
  router.post('/ciudades',    authenticate, requireAdmin, validateBody(CiudadCreateSchema),  controller.createCiudad);
  router.patch('/ciudades/:id', authenticate, requireAdmin, validateBody(CiudadUpdateSchema), controller.updateCiudad);
  router.delete('/ciudades/:id', authenticate, requireAdmin, controller.deleteCiudad);

  return router;
}
