import { Request, Response, NextFunction } from 'express';
import { VehiculoRepository } from './vehiculo.repository.js';
import { NotFoundException }  from '../../shared/errors/BusinessException.js';

export class VehiculoController {
  constructor(private readonly vehiculoRepository: VehiculoRepository) {}

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page   = Number(req.query.page)  || 1;
      const limit  = Number(req.query.limit) || 20;
      const filters = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      req.query['status']      as string | undefined,
      };
      res.json({ success: true, data: await this.vehiculoRepository.findAll(page, limit, filters) });
    } catch (err) { next(err); }
  };

  marketplace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      'DISPONIBLE',
      };
      const result = await this.vehiculoRepository.findAll(1, 200, filters);
      res.json({ success: true, data: result.data });
    } catch (err) { next(err); }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        agenciaId:   req.query['agenciaId']   as string | undefined,
        categoriaId: req.query['categoriaId'] as string | undefined,
        status:      'DISPONIBLE',
      };
      const result = await this.vehiculoRepository.findAll(1, 200, filters);
      res.json({ success: true, data: result.data });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiculo = await this.vehiculoRepository.findById(req.params['id'] as string);
      if (!vehiculo) throw new NotFoundException('Vehiculo', req.params['id'] as string);
      res.json({ success: true, data: vehiculo });
    } catch (err) { next(err); }
  };

  checkDisponibilidad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiculo = await this.vehiculoRepository.findById(req.params['id'] as string);
      if (!vehiculo) throw new NotFoundException('Vehiculo', req.params['id'] as string);
      const disponible = vehiculo.status === 'DISPONIBLE' && vehiculo.isActive;
      res.json({
        success: true,
        data: {
          vehiculoId:  vehiculo.id,
          disponible,
          status:      vehiculo.status,
          mensaje:     disponible
            ? 'El vehículo está disponible para alquiler'
            : `El vehículo no está disponible (estado: ${vehiculo.status})`,
        },
      });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true, data: await this.vehiculoRepository.create(req.body) });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.vehiculoRepository.update(req.params['id'] as string, req.body) });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.vehiculoRepository.delete(req.params['id'] as string);
      res.json({ success: true, data: { deactivated: true } });
    } catch (err) { next(err); }
  };
}
