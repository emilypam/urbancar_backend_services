import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } });
    return;
  }

  let payload: any;
  try {
    const token = header.slice(7);
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } });
    return;
  }

  prisma.usuario
    .findUnique({ where: { id: payload.id }, select: { isActive: true } })
    .then((usuario) => {
      if (!usuario || !usuario.isActive) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Usuario inactivo o bloqueado' } });
        return;
      }
      req.user = { id: payload.id, email: payload.email, role: payload.role };
      next();
    })
    .catch(() => {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al verificar sesión' } });
    });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Autenticación requerida' } });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Acceso denegado' } });
    return;
  }
  next();
}
