import { Request, Response, NextFunction } from 'express';
import { MantenimientoServiceV2 } from './mantenimiento.service.v2.js';

export class MantenimientoControllerV2 {
  constructor(private readonly service: MantenimientoServiceV2) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const m = await this.service.crearMantenimiento(req.body);
      res.status(201).json({ success: true, data: m });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const m = await this.service.actualizarMantenimiento(req.params['id'] as string, req.body);
      res.json({ success: true, data: m });
    } catch (err) { next(err); }
  };
}
