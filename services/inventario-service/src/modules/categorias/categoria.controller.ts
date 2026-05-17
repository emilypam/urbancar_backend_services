import { Request, Response, NextFunction } from 'express';
import { CategoriaRepository } from './categoria.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class CategoriaController {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.categoriaRepository.findAll() }); }
    catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoria = await this.categoriaRepository.findById(req.params['id'] as string);
      if (!categoria) throw new NotFoundException('Categoria', req.params['id'] as string);
      res.json({ success: true, data: categoria });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.categoriaRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.categoriaRepository.update(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.categoriaRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };
}
