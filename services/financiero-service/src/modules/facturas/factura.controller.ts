import { Request, Response, NextFunction } from 'express';
import { FacturaRepository } from './factura.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class FacturaController {
  constructor(private readonly facturaRepository: FacturaRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page      = Number(req.query.page)  || 1;
      const limit     = Number(req.query.limit) || 20;
      const reservaId = req.query['reservaId'] as string | undefined;
      res.json({ success: true, data: await this.facturaRepository.findAll(page, limit, reservaId) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const factura = await this.facturaRepository.findById(req.params['id'] as string);
      if (!factura) throw new NotFoundException('Factura', req.params['id'] as string);
      res.json({ success: true, data: factura });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true, data: await this.facturaRepository.create(req.body) });
    } catch (err) { next(err); }
  };
}
