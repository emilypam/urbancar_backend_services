import { Request, Response, NextFunction } from 'express';
import { MantenimientoRepository } from './mantenimiento.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

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
      res.status(201).json({ success: true, data: await this.mantenimientoRepository.create(req.body) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const m = await this.mantenimientoRepository.findById(req.params['id'] as string);
      if (!m) throw new NotFoundException('Mantenimiento', req.params['id'] as string);
      res.json({ success: true, data: await this.mantenimientoRepository.update(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };
}
