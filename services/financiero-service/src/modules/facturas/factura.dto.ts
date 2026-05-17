import { z } from 'zod';

export const FacturaCreateSchema = z.object({
  reservaId:   z.string().uuid('reservaId debe ser UUID'),
  pagoId:      z.string().uuid('pagoId debe ser UUID').optional(),
  rucCliente:  z.string().max(13).optional(),
  razonSocial: z.string().max(150).optional(),
  detalles: z.array(z.object({
    descripcion: z.string().min(1),
    cantidad:    z.number().int().min(1).default(1),
    precioUnit:  z.number().positive(),
  })).min(1, 'Debe incluir al menos un detalle'),
});

export type FacturaCreateDto = z.infer<typeof FacturaCreateSchema>;
