import { z } from 'zod';

export const TipoTransmisionCreateSchema = z.object({
  nombre: z.string().min(1).max(100),
});
