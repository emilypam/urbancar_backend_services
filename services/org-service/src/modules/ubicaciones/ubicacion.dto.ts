import { z } from 'zod';

export const ProvinciaCreateSchema = z.object({
  nombre: z.string().min(1).max(100),
  codigo: z.string().min(1).max(10),
});
export const ProvinciaUpdateSchema = ProvinciaCreateSchema.partial();

export const CiudadCreateSchema = z.object({
  nombre:      z.string().min(1).max(100),
  provinciaId: z.string().uuid('provinciaId debe ser UUID').optional(),
});
export const CiudadUpdateSchema = CiudadCreateSchema.partial();
