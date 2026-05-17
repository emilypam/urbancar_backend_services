import { z } from 'zod';

export const CategoriaCreateSchema = z.object({
  nombre:      z.string().min(1).max(100),
  descripcion: z.string().optional(),
});
export const CategoriaUpdateSchema = CategoriaCreateSchema.partial();
