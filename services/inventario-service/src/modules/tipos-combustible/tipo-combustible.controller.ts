import { Request, Response, NextFunction } from 'express';
import { TipoCombustibleRepository } from './tipo-combustible.repository.js';

export class TipoCombustibleController {
  constructor(private readonly tipoCombustibleRepository: TipoCombustibleRepository) {}

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.tipoCombustibleRepository.findAll() }); }
    catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.tipoCombustibleRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.tipoCombustibleRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };
}
