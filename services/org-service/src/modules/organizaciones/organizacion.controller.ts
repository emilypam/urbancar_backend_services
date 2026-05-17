import { Request, Response, NextFunction } from 'express';
import { OrganizacionRepository } from './organizacion.repository.js';
import { NotFoundException }       from '../../shared/errors/BusinessException.js';

export class OrganizacionController {
  constructor(private readonly organizacionRepository: OrganizacionRepository) {}

  // ── Empresas ─────────────────────────────────────────────────────────────────
  listEmpresas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page  = Number(req.query.page)  || 1;
      const limit = Number(req.query.limit) || 20;
      res.json({ success: true, data: await this.organizacionRepository.findAllEmpresas(page, limit) });
    } catch (err) { next(err); }
  };

  getEmpresaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const empresa = await this.organizacionRepository.findEmpresaById(req.params['id'] as string);
      if (!empresa) throw new NotFoundException('Empresa', req.params['id'] as string);
      res.json({ success: true, data: empresa });
    } catch (err) { next(err); }
  };

  createEmpresa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true, data: await this.organizacionRepository.createEmpresa(req.body) });
    } catch (err) { next(err); }
  };

  updateEmpresa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.organizacionRepository.updateEmpresa(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };

  deleteEmpresa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.organizacionRepository.deleteEmpresa(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };

  // ── Agencias ──────────────────────────────────────────────────────────────────
  listAgencias = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page      = Number(req.query.page)  || 1;
      const limit     = Number(req.query.limit) || 20;
      const empresaId = req.query['empresaId'] as string | undefined;
      res.json({ success: true, data: await this.organizacionRepository.findAllAgencias(page, limit, empresaId) });
    } catch (err) { next(err); }
  };

  getAgenciaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agencia = await this.organizacionRepository.findAgenciaById(req.params['id'] as string);
      if (!agencia) throw new NotFoundException('Agencia', req.params['id'] as string);
      res.json({ success: true, data: agencia });
    } catch (err) { next(err); }
  };

  createAgencia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true, data: await this.organizacionRepository.createAgencia(req.body) });
    } catch (err) { next(err); }
  };

  updateAgencia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.organizacionRepository.updateAgencia(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };

  deleteAgencia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.organizacionRepository.deleteAgencia(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };
}
