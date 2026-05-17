import { z } from 'zod';

export const VehiculoCreateSchema = z.object({
  agenciaId:         z.string().uuid('agenciaId debe ser UUID'),
  modeloId:          z.string().uuid('modeloId debe ser UUID'),
  categoriaId:       z.string().uuid('categoriaId debe ser UUID'),
  tipoCombustibleId: z.string().uuid('tipoCombustibleId debe ser UUID'),
  tipoTransmisionId: z.string().uuid('tipoTransmisionId debe ser UUID'),
  placa:             z.string().min(1).max(20),
  color:             z.string().max(50).optional(),
  anio:              z.number().int().min(1990).max(new Date().getFullYear() + 1),
  kilometraje:       z.number().int().min(0).optional(),
  numeroPasajeros:   z.number().int().min(1).max(20).optional(),
  precioDia:         z.number().positive('precioDia debe ser positivo'),
  imagenUrl:         z.string().url().optional(),
  descripcion:       z.string().optional(),
});

export const VehiculoUpdateSchema = VehiculoCreateSchema.partial().extend({
  status: z.enum(['DISPONIBLE', 'RESERVADO', 'EN_USO', 'MANTENIMIENTO', 'INACTIVO']).optional(),
});

export type VehiculoCreateDto = z.infer<typeof VehiculoCreateSchema>;
export type VehiculoUpdateDto = z.infer<typeof VehiculoUpdateSchema>;
