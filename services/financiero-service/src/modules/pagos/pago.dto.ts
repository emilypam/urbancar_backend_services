import { z } from 'zod';

export const PagoCreateSchema = z.object({
  reservaId:  z.string().uuid('reservaId debe ser UUID'),
  monto:      z.number().positive('monto debe ser positivo'),
  metodoPago: z.string().min(1).max(50),
  referencia: z.string().max(100).optional(),
});

export const PagoUpdateSchema = z.object({
  status:     z.enum(['PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO']).optional(),
  referencia: z.string().max(100).optional(),
});

export type PagoCreateDto = z.infer<typeof PagoCreateSchema>;
export type PagoUpdateDto = z.infer<typeof PagoUpdateSchema>;
