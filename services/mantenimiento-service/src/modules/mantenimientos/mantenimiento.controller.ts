import { Request, Response, NextFunction } from 'express';
import { MantenimientoRepository } from './mantenimiento.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';
import jwt from 'jsonwebtoken';

const OPERACIONES_URL = process.env['OPERACIONES_SERVICE_URL'] ?? 'http://operaciones-service';
const JWT_SECRET      = process.env['JWT_SECRET'] ?? 'dev-secret';

function serviceToken(): string {
  return jwt.sign(
    { id: 'mantenimiento-service', email: 'service@urbancar.internal', role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '60s' },
  );
}

function syncKardex(vehiculoId: string, estadoAnterior: string, estadoNuevo: string, evento: string, referencia?: string): void {
  fetch(`${OPERACIONES_URL}/api/v1/emilypamela/kardex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceToken()}` },
    body: JSON.stringify({ vehiculoId, estadoAnterior, estadoNuevo, evento, referencia }),
  }).catch(() => {});
}

export class MantenimientoController {
  constructor(private readonly mantenimientoRepository: MantenimientoRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page       = Number(req.query.page)  || 1;
      const limit      = Number(req.query.limit) || 20;
      const vehiculoId = req.query['vehiculoId'] as string | undefined;
      res.json({ success: true, data: await this.mantenimientoRepository.findAll(page, limit, vehiculoId) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const m = await this.mantenimientoRepository.findById(req.params['id'] as string);
      if (!m) throw new NotFoundException('Mantenimiento', req.params['id'] as string);
      res.json({ success: true, data: m });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const m = await this.mantenimientoRepository.create(req.body);
      if (m.vehiculoId) syncKardex(m.vehiculoId, 'DISPONIBLE', 'MANTENIMIENTO', 'MANTENIMIENTO_INICIADO', m.id);
      res.status(201).json({ success: true, data: m });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const m = await this.mantenimientoRepository.findById(req.params['id'] as string);
      if (!m) throw new NotFoundException('Mantenimiento', req.params['id'] as string);
      const updated = await this.mantenimientoRepository.update(req.params['id'] as string, req.body);
      if (req.body.fechaFin && m.vehiculoId) syncKardex(m.vehiculoId, 'MANTENIMIENTO', 'DISPONIBLE', 'MANTENIMIENTO_FINALIZADO', m.id);
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  };
}
