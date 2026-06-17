import { Request, Response, NextFunction } from 'express';
import { KardexRepository } from './kardex.repository.js';
import { publish } from '../../messaging/publisher.js';

export class KardexController {
  constructor(private readonly kardexRepository: KardexRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page       = Number(req.query.page)  || 1;
      const limit      = Number(req.query.limit) || 50;
      const vehiculoId = req.query['vehiculoId'] as string | undefined;
      res.json({ success: true, data: await this.kardexRepository.findAll(page, limit, vehiculoId) });
    } catch (err) { next(err); }
  };

  getByVehiculo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.kardexRepository.findByVehiculo(req.params['vehiculoId'] as string) });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = { ...req.body, usuarioId: req.user!.id };
      const k = await this.kardexRepository.create(data);

      publish('mantenimiento.kardex.registrado', k.id, {
        kardexId:   k.id,
        vehiculoId: k.vehiculoId,
        tipo:       k.tipo,
        descripcion: k.descripcion,
        usuarioId:  k.usuarioId,
      });

      res.status(201).json({ success: true, data: k });
    } catch (err) { next(err); }
  };
}
