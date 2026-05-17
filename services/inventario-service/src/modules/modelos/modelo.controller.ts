import { Request, Response, NextFunction } from 'express';
import { ModeloRepository } from './modelo.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class ModeloController {
  constructor(private readonly modeloRepository: ModeloRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const marcaId = req.query['marcaId'] as string | undefined;
      res.json({ success: true, data: await this.modeloRepository.findAll(marcaId) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const modelo = await this.modeloRepository.findById(req.params['id'] as string);
      if (!modelo) throw new NotFoundException('Modelo', req.params['id'] as string);
      res.json({ success: true, data: modelo });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.modeloRepository.create(req.body) }); }
    catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.modeloRepository.update(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.modeloRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };
}
