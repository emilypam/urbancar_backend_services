import { getChannel, EXCHANGE, DLQ } from '../rabbitmq.js';
import prisma from '../../shared/database/prisma.js';

const QUEUE_INICIO = 'inventario.mantenimiento.inicio';
const QUEUE_FIN    = 'inventario.mantenimiento.fin';

export async function startVehiculoMantenimientoConsumer(): Promise<void> {
  const ch = getChannel();
  if (!ch) {
    console.warn('[inventario-service] consumer vehiculo-mantenimiento no iniciado — RabbitMQ no disponible');
    return;
  }

  // Vehículo entra a mantenimiento
  await ch.assertQueue(QUEUE_INICIO, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': DLQ },
  });
  await ch.bindQueue(QUEUE_INICIO, EXCHANGE, 'mantenimiento.vehiculo.en_mantenimiento');
  await ch.prefetch(1);

  ch.consume(QUEUE_INICIO, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const { vehiculoId } = event.data as { vehiculoId?: string };

      if (vehiculoId) {
        await prisma.vehiculo.update({
          where: { id: vehiculoId },
          data:  { status: 'MANTENIMIENTO' },
        });
        console.log(`[inventario-service] ✅ vehiculo ${vehiculoId} → MANTENIMIENTO`);
      }

      ch.ack(msg);
    } catch (err) {
      console.error('[inventario-service] consumer vehiculo-mantenimiento error:', err);
      ch.nack(msg, false, false);
    }
  });

  // Vehículo sale de mantenimiento
  await ch.assertQueue(QUEUE_FIN, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': DLQ },
  });
  await ch.bindQueue(QUEUE_FIN, EXCHANGE, 'mantenimiento.vehiculo.disponible');

  ch.consume(QUEUE_FIN, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const { vehiculoId } = event.data as { vehiculoId?: string };

      if (vehiculoId) {
        await prisma.vehiculo.update({
          where: { id: vehiculoId },
          data:  { status: 'DISPONIBLE' },
        });
        console.log(`[inventario-service] ✅ vehiculo ${vehiculoId} → DISPONIBLE (mantenimiento finalizado)`);
      }

      ch.ack(msg);
    } catch (err) {
      console.error('[inventario-service] consumer vehiculo-disponible error:', err);
      ch.nack(msg, false, false);
    }
  });

  console.log(`[inventario-service] consumers mantenimiento escuchando → ${QUEUE_INICIO}, ${QUEUE_FIN}`);
}
