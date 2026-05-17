import { Request, Response, NextFunction } from 'express';
import { ExtraRepository } from './extra.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class ExtraController {
  constructor(private readonly extraRepository: ExtraRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const onlyActive = req.query['active'] === 'true';
      res.json({ success: true, data: await this.extraRepository.findAll(onlyActive) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const extra = await this.extraRepository.findById(req.params['id'] as string);
      if (!extra) throw new NotFoundException('Extra', req.params['id'] as string);
      res.json({ success: true, data: extra });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.extraRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.extraRepository.update(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.extraRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };
}
