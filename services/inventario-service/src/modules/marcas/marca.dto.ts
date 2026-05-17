import { z } from 'zod';

export const MarcaCreateSchema = z.object({
  nombre:  z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
});
export const MarcaUpdateSchema = MarcaCreateSchema.partial();
