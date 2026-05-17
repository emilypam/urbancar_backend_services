import { z } from 'zod';

export const REGEX = {
  SOLO_LETRAS:  /^[a-zA-ZÀ-ÿ\s]+$/,
  SOLO_DIGITOS: /^\d+$/,
  CEDULA_EC:    /^\d{10}$/,
  TELEFONO:     /^[\d\s+()\-]{7,20}$/,
  UUID:         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export function esCedulaValida(cedula: string): boolean {
  if (!REGEX.CEDULA_EC.test(cedula)) return false;
  const prov = parseInt(cedula.substring(0, 2));
  if (prov < 1 || prov > 24) return false;
  const d = cedula.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let v = d[i] * (i % 2 === 0 ? 2 : 1);
    if (v > 9) v -= 9;
    sum += v;
  }
  const mod = sum % 10;
  return (mod === 0 ? 0 : 10 - mod) === d[9];
}

export const zSoloLetras = (campo: string, min = 2, max = 100) =>
  z.string().trim()
    .min(min, `${campo} debe tener al menos ${min} caracteres`)
    .max(max, `${campo} no puede superar ${max} caracteres`)
    .regex(REGEX.SOLO_LETRAS, `${campo} solo puede contener letras`);

export const zTelefonoOpcional = z.string().trim().optional()
  .refine(
    v => !v || REGEX.TELEFONO.test(v),
    'Teléfono inválido',
  );

export const zCedulaOpcional = z.string().trim().optional()
  .refine(
    v => !v || (REGEX.CEDULA_EC.test(v) && esCedulaValida(v)),
    'Cédula ecuatoriana inválida',
  );
