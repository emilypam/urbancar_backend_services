import { getChannel, EXCHANGE } from './rabbitmq.js';
import { broadcast } from '../ws/socket-server.js';
import type { DomainEvent } from './event-types.js';
import { logger } from '../logger.js';

const ROUTING_TO_WS: Record<string, string> = {
  'reservas.reserva.creada':               'reserva:creada',
  'reservas.reserva.confirmada':           'reserva:confirmada',
  'reservas.reserva.cancelada':            'reserva:cancelada',
  'reservas.reserva.completada':           'reserva:completada',
  'pagos.pago.procesado':                  'pago:procesado',
  'pagos.pago.fallido':                    'pago:fallido',
  'facturas.factura.generada':             'factura:generada',
  'alquileres.alquiler.iniciado':          'alquiler:iniciado',
  'alquileres.devolucion.registrada':      'devolucion:registrada',
  'mantenimiento.vehiculo.en_mantenimiento': 'vehiculo:actualizado',
  'mantenimiento.vehiculo.disponible':     'vehiculo:actualizado',
  'mantenimiento.kardex.registrado':       'kardex:registrado',
};

export async function startConsumer(): Promise<void> {
  const ch = getChannel();
  if (!ch) {
    logger.warn('canal RabbitMQ no disponible — reintentando en 5s');
    setTimeout(startConsumer, 5000);
    return;
  }

  try {
    const { queue } = await ch.assertQueue('', { exclusive: true, autoDelete: true });
    await ch.bindQueue(queue, EXCHANGE, '#');

    logger.info('consumer suscrito', { exchange: EXCHANGE, queue });

    ch.consume(queue, (msg) => {
      if (!msg) return;
      ch.ack(msg);
      try {
        const event: DomainEvent = JSON.parse(msg.content.toString());
        const wsEvt = ROUTING_TO_WS[event.eventType] ?? event.eventType;
        logger.info('evento recibido', { eventType: event.eventType, wsEvent: wsEvt, eventId: event.eventId, correlationId: event.correlationId });
        broadcast(wsEvt, event);
      } catch (err) {
        logger.error('error parseando mensaje RabbitMQ', { error: String(err) });
      }
    });
  } catch (err) {
    logger.error('error iniciando consumer', { error: String(err) });
    setTimeout(startConsumer, 5000);
  }
}
