import { Request, Response, NextFunction } from 'express';
import { TipoTransmisionRepository } from './tipo-transmision.repository.js';

export class TipoTransmisionController {
  constructor(private readonly tipoTransmisionRepository: TipoTransmisionRepository) {}

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.tipoTransmisionRepository.findAll() }); }
    catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.tipoTransmisionRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.tipoTransmisionRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };
}
