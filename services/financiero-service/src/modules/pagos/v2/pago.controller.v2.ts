import { Request, Response, NextFunction } from 'express';
import { PagoServiceV2 } from './pago.service.v2.js';

export class PagoControllerV2 {
  constructor(private readonly service: PagoServiceV2) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pago = await this.service.crearPago(req.body);
      res.status(201).json({ success: true, data: pago });
    } catch (err) { next(err); }
  };

  marcarFallido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pago = await this.service.marcarFallido(req.params['id'] as string);
      res.json({ success: true, data: pago });
    } catch (err) { next(err); }
  };
}
