import { MantenimientoRepository } from '../mantenimiento.repository.js';
import { publish } from '../../../messaging/publisher.js';
import { NotFoundException } from '../../../shared/errors/BusinessException.js';

export class MantenimientoServiceV2 {
  constructor(private readonly repo: MantenimientoRepository) {}

  async crearMantenimiento(body: any) {
    const m = await this.repo.create(body);

    // V2: publicar evento en lugar de llamar HTTP a operaciones-service/kardex
    if (m.vehiculoId) {
      publish('mantenimiento.vehiculo.en_mantenimiento', m.id, {
        mantenimientoId: m.id,
        vehiculoId:      m.vehiculoId,
        estadoAnterior:  'DISPONIBLE',
        estadoNuevo:     'MANTENIMIENTO',
        evento:          'MANTENIMIENTO_INICIADO',
        referencia:      m.id,
      });
    }

    return m;
  }

  async actualizarMantenimiento(id: string, body: any) {
    const m = await this.repo.findById(id);
    if (!m) throw new NotFoundException('Mantenimiento', id);

    const updated = await this.repo.update(id, body);

    // Si se registra fechaFin, el vehículo vuelve a estar disponible
    if (body.fechaFin && m.vehiculoId) {
      publish('mantenimiento.vehiculo.disponible', id, {
        mantenimientoId: id,
        vehiculoId:      m.vehiculoId,
        estadoAnterior:  'MANTENIMIENTO',
        estadoNuevo:     'DISPONIBLE',
        evento:          'MANTENIMIENTO_FINALIZADO',
        referencia:      id,
      });
    }

    return updated;
  }
}
