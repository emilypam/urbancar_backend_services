import { z } from 'zod';

export const SistemaExternoCreateSchema = z.object({
  nombre:   z.string().min(1).max(100),
  codigo:   z.string().min(1).max(20),
  url:      z.string().url().optional(),
  apiKey:   z.string().optional(),
});

export const SistemaExternoUpdateSchema = SistemaExternoCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});
