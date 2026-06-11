import { PagoRepository } from '../pago.repository.js';
import { publish } from '../../../messaging/publisher.js';

export class PagoServiceV2 {
  constructor(private readonly repo: PagoRepository) {}

  async crearPago(body: any) {
    const pago = await this.repo.create(body);

    // V2: publicar evento en lugar de llamar HTTP a operaciones-service
    // operaciones-service consume pagos.pago.procesado y confirma la reserva
    publish('pagos.pago.procesado', pago.id, {
      pagoId:    pago.id,
      reservaId: pago.reservaId,
      monto:     pago.monto,
      metodo:    pago.metodoPago,
      status:    pago.status,
    });

    return pago;
  }

  async marcarFallido(id: string) {
    const pago = await this.repo.update(id, { status: 'FALLIDO' });

    publish('pagos.pago.fallido', id, {
      pagoId:    id,
      reservaId: pago.reservaId,
    });

    return pago;
  }
}
