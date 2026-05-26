import { Request, Response, NextFunction } from 'express';
import { PagoRepository } from './pago.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';
import jwt from 'jsonwebtoken';

const OPERACIONES_URL = process.env['OPERACIONES_SERVICE_URL'] ?? 'http://operaciones-service';
const JWT_SECRET      = process.env['JWT_SECRET'] ?? 'dev-secret';

function serviceToken(): string {
  return jwt.sign(
    { id: 'financiero-service', email: 'service@urbancar.internal', role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '60s' },
  );
}

function confirmarReserva(reservaId: string): void {
  fetch(`${OPERACIONES_URL}/api/v1/emilypamela/reservas/${reservaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceToken()}` },
    body: JSON.stringify({ status: 'CONFIRMADA' }),
  }).catch(() => {});
}

export class PagoController {
  constructor(private readonly pagoRepository: PagoRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page      = Number(req.query.page)  || 1;
      const limit     = Number(req.query.limit) || 20;
      const reservaId = req.query['reservaId'] as string | undefined;
      const status    = req.query['status']    as string | undefined;
      res.json({ success: true, data: await this.pagoRepository.findAll(page, limit, reservaId, status) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pago = await this.pagoRepository.findById(req.params['id'] as string);
      if (!pago) throw new NotFoundException('Pago', req.params['id'] as string);
      res.json({ success: true, data: pago });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pago = await this.pagoRepository.create(req.body);
      if (pago.reservaId) confirmarReserva(pago.reservaId);
      res.status(201).json({ success: true, data: pago });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pago = await this.pagoRepository.findById(req.params['id'] as string);
      if (!pago) throw new NotFoundException('Pago', req.params['id'] as string);
      res.json({ success: true, data: await this.pagoRepository.update(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };
}
