import { Router } from 'express';
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.middleware.js';
import {
  crearReserva,
  cancelarReserva,
  iniciarAlquiler,
  registrarDevolucion,
  listarEventos,
} from './orchestrator.controller.js';

export function createOrchestratorRouter(): Router {
  const router = Router();

  router.post('/reservas',            authenticate, crearReserva);
  router.post('/reservas/:id/cancelar', authenticate, cancelarReserva);
  router.post('/alquileres',          authenticate, iniciarAlquiler);
  router.post('/devoluciones',        authenticate, requireAdmin, registrarDevolucion);
  router.get('/eventos',              authenticate, requireAdmin, listarEventos);

  return router;
}
