import { Request, Response, NextFunction } from 'express';
import { MarcaRepository } from './marca.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class MarcaController {
  constructor(private readonly marcaRepository: MarcaRepository) {}

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.marcaRepository.findAll() }); }
    catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const marca = await this.marcaRepository.findById(req.params['id'] as string);
      if (!marca) throw new NotFoundException('Marca', req.params['id'] as string);
      res.json({ success: true, data: marca });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.marcaRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.marcaRepository.update(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.marcaRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };
}
