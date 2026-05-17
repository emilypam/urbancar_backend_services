import { z } from 'zod';

export const ExtraCreateSchema = z.object({
  nombre:      z.string().min(1).max(100),
  descripcion: z.string().optional(),
  precioDia:   z.number().positive('precioDia debe ser positivo'),
});
export const ExtraUpdateSchema = ExtraCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});
