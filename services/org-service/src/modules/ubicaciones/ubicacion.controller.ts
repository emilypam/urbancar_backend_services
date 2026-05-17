import { Request, Response, NextFunction } from 'express';
import { UbicacionRepository } from './ubicacion.repository.js';
import { NotFoundException }   from '../../shared/errors/BusinessException.js';

export class UbicacionController {
  constructor(private readonly ubicacionRepository: UbicacionRepository) {}

  // ── Provincias ────────────────────────────────────────────────────────────────
  listProvincias = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.ubicacionRepository.findAllProvincias() }); }
    catch (err) { next(err); }
  };

  getProvinciaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provincia = await this.ubicacionRepository.findProvinciaById(req.params['id'] as string);
      if (!provincia) throw new NotFoundException('Provincia', req.params['id'] as string);
      res.json({ success: true, data: provincia });
    } catch (err) { next(err); }
  };

  createProvincia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.ubicacionRepository.createProvincia(req.body) }); }
    catch (err) { next(err); }
  };

  updateProvincia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.ubicacionRepository.updateProvincia(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  deleteProvincia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.ubicacionRepository.deleteProvincia(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };

  // ── Ciudades ──────────────────────────────────────────────────────────────────
  listCiudades = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provinciaId = req.query['provinciaId'] as string | undefined;
      res.json({ success: true, data: await this.ubicacionRepository.findAllCiudades(provinciaId) });
    } catch (err) { next(err); }
  };

  getCiudadById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ciudad = await this.ubicacionRepository.findCiudadById(req.params['id'] as string);
      if (!ciudad) throw new NotFoundException('Ciudad', req.params['id'] as string);
      res.json({ success: true, data: ciudad });
    } catch (err) { next(err); }
  };

  createCiudad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json({ success: true, data: await this.ubicacionRepository.createCiudad(req.body) }); }
    catch (err) { next(err); }
  };

  updateCiudad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json({ success: true, data: await this.ubicacionRepository.updateCiudad(req.params['id'] as string, req.body) }); }
    catch (err) { next(err); }
  };

  deleteCiudad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.ubicacionRepository.deleteCiudad(req.params['id'] as string);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  };
}
