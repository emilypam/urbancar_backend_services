import { z } from 'zod';

export const EmpresaCreateSchema = z.object({
  nombre:   z.string().min(1).max(150),
  ruc:      z.string().length(13, 'RUC debe tener 13 dígitos'),
  email:    z.string().email().optional(),
  telefono: z.string().max(20).optional(),
  logoUrl:  z.string().url().optional(),
});
export const EmpresaUpdateSchema = EmpresaCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const AgenciaCreateSchema = z.object({
  empresaId: z.string().uuid('empresaId debe ser UUID'),
  ciudadId:  z.string().uuid('ciudadId debe ser UUID').optional(),
  nombre:    z.string().max(150).optional(),
  direccion: z.string().max(255).optional(),
  telefono:  z.string().max(20).optional(),
  email:     z.string().email().optional(),
});
export const AgenciaUpdateSchema = AgenciaCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});
