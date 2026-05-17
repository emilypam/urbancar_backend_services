import { Request, Response, NextFunction } from 'express';
import { PagoRepository } from './pago.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

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
      res.status(201).json({ success: true, data: await this.pagoRepository.create(req.body) });
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
