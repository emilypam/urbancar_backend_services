import { z } from 'zod';
import { zSoloLetras, zTelefonoOpcional } from '../../shared/utils/validation.utils.js';

export const UpdateUsuarioSchema = z.object({
  nombres:   zSoloLetras('Nombres', 2, 100).optional(),
  apellidos: zSoloLetras('Apellidos', 2, 100).optional(),
  telefono:  zTelefonoOpcional,
  ciudadId:  z.string().uuid('ID de ciudad inválido').optional(),
  isActive:  z.boolean().optional(),
});

export type UpdateUsuarioDto = z.infer<typeof UpdateUsuarioSchema>;
