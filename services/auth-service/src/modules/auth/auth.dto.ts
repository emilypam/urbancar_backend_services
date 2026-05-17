import { z } from 'zod';
import { zSoloLetras, zCedulaOpcional, zTelefonoOpcional } from '../../shared/utils/validation.utils.js';

export const RegisterSchema = z.object({
  email:     z.string().trim().min(1, 'El email es requerido').email('Formato de email inválido'),
  password:  z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  nombres:   zSoloLetras('Nombres', 2, 100),
  apellidos: zSoloLetras('Apellidos', 2, 100),
  cedula:    zCedulaOpcional,
  telefono:  zTelefonoOpcional,
  ciudadId:  z.string().uuid('El ID de ciudad no es válido').optional(),
});

export const LoginSchema = z.object({
  email:    z.string().trim().min(1, 'El email es requerido').email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const UpdateProfileSchema = z.object({
  nombres:   zSoloLetras('Nombres', 2, 100).optional(),
  apellidos: zSoloLetras('Apellidos', 2, 100).optional(),
  telefono:  zTelefonoOpcional,
  ciudadId:  z.string().uuid('El ID de ciudad no es válido').optional(),
});

export type RegisterDto      = z.infer<typeof RegisterSchema>;
export type LoginDto         = z.infer<typeof LoginSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
