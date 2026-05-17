import { z } from 'zod';

export const TipoCombustibleCreateSchema = z.object({
  nombre: z.string().min(1).max(100),
});
