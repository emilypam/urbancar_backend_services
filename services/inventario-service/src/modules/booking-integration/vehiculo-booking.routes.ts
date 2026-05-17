import { Router } from 'express';
import { VehiculoRepository } from '../vehiculos/vehiculo.repository.js';

function toBookingDto(v: any) {
  return {
    id:           v.id,
    nombre:       `${v.modelo?.marca?.nombre ?? ''} ${v.modelo?.nombre ?? ''} ${v.anio}`.trim(),
    descripcion:  v.descripcion ?? null,
    precioPorDia: Number(v.precioDia),
    moneda:       'USD',
    categoria:    v.categoria?.nombre ?? null,
    agenciaId:    v.agenciaId ?? null,
    disponible:   v.status === 'DISPONIBLE' && v.isActive,
    status:       v.status,
    imagenUrl:    v.imagenUrl ?? null,
  };
}

export function createVehiculoBookingRouter(repo: VehiculoRepository): Router {
  const router = Router();

  // GET /api/v1/emilypamela/vehiculos/booking
  router.get('/', async (req, res, next) => {
    try {
      const page   = Number(req.query.page)  || 1;
      const limit  = Number(req.query.limit) || 20;
      const result = await repo.findAll(page, limit, {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      (req.query['status'] as string | undefined) ?? 'DISPONIBLE',
      });
      res.json({ success: true, data: { ...result, data: result.data.map(toBookingDto) } });
    } catch (err) { next(err); }
  });

  // GET /api/v1/emilypamela/vehiculos/booking/:id/disponibilidad  — must be before /:id
  router.get('/:id/disponibilidad', async (req, res, next) => {
    try {
      const vehiculo = await repo.findById(req.params['id'] as string);
      if (!vehiculo) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Vehiculo ${req.params['id']} no encontrado` } });
        return;
      }
      const disponible = vehiculo.status === 'DISPONIBLE' && vehiculo.isActive;
      res.json({
        success: true,
        data: {
          vehiculoId: vehiculo.id,
          disponible,
          status:  vehiculo.status,
          mensaje: disponible
            ? 'El vehículo está disponible para alquiler'
            : `El vehículo no está disponible (estado: ${vehiculo.status})`,
        },
      });
    } catch (err) { next(err); }
  });

  // GET /api/v1/emilypamela/vehiculos/booking/:id
  router.get('/:id', async (req, res, next) => {
    try {
      const vehiculo = await repo.findById(req.params['id'] as string);
      if (!vehiculo) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Vehiculo ${req.params['id']} no encontrado` } });
        return;
      }
      res.json({ success: true, data: toBookingDto(vehiculo) });
    } catch (err) { next(err); }
  });

  return router;
}
