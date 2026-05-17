import { z } from 'zod';

export const KardexCreateSchema = z.object({
  vehiculoId:     z.string().uuid('vehiculoId debe ser UUID'),
  evento:         z.string().min(1).max(100),
  estadoAnterior: z.string().max(50).optional(),
  estadoNuevo:    z.string().max(50).optional(),
  referencia:     z.string().max(100).optional(),
});

export type KardexCreateDto = z.infer<typeof KardexCreateSchema>;
