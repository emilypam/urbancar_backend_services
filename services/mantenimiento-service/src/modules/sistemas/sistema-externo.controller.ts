import { Request, Response, NextFunction } from 'express';
import { SistemaExternoRepository } from './sistema-externo.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class SistemaExternoController {
  constructor(private readonly sistemaExternoRepository: SistemaExternoRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const onlyActive = req.query['active'] === 'true';
      res.json({ success: true, data: await this.sistemaExternoRepository.findAll(onlyActive) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const s = await this.sistemaExternoRepository.findById(req.params['id'] as string);
      if (!s) throw new NotFoundException('Sistema Externo', req.params['id'] as string);
      res.json({ success: true, data: s });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.sistemaExternoRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.sistemaExternoRepository.update(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.sistemaExternoRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };
}
