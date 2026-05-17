import { z } from 'zod';

export const ModeloCreateSchema = z.object({
  marcaId: z.string().uuid('marcaId debe ser UUID'),
  nombre:  z.string().min(1).max(100),
});
export const ModeloUpdateSchema = ModeloCreateSchema.partial();
