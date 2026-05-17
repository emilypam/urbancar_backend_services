import { Request, Response, NextFunction } from 'express';
import { UsuarioRepository } from './usuario.repository.js';
import { NotFoundException } from '../../shared/errors/BusinessException.js';

export class UsuarioController {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page  = Number(req.query.page)  || 1;
      const limit = Number(req.query.limit) || 20;
      res.json({ success: true, data: await this.usuarioRepository.findAll(page, limit) });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usuario = await this.usuarioRepository.findByIdWithRelations(req.params['id'] as string);
      if (!usuario) throw new NotFoundException('Usuario', req.params['id'] as string);
      res.json({ success: true, data: usuario });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password_hash, ...safeData } = req.body;
      res.json({ success: true, data: await this.usuarioRepository.update(req.params['id'] as string, safeData) });
    } catch (err) { next(err); }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.usuarioRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };
}
