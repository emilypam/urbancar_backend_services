import { z } from 'zod';

export const MantenimientoCreateSchema = z.object({
  vehiculoId:   z.string().uuid('vehiculoId debe ser UUID'),
  tipo:         z.string().min(1).max(100),
  descripcion:  z.string().optional(),
  fechaInicio:  z.string().datetime(),
  fechaFin:     z.string().datetime().optional(),
  costo:        z.number().min(0).optional(),
  tecnico:      z.string().max(100).optional(),
});

export const MantenimientoUpdateSchema = MantenimientoCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type MantenimientoCreateDto = z.infer<typeof MantenimientoCreateSchema>;
export type MantenimientoUpdateDto = z.infer<typeof MantenimientoUpdateSchema>;
