import { getChannel, EXCHANGE, DLQ } from '../rabbitmq.js';
import prisma from '../../shared/database/prisma.js';

const QUEUE = 'inventario.reservas.canceladas';

export async function startReservaCanceladaConsumer(): Promise<void> {
  const ch = getChannel();
  if (!ch) {
    console.warn('[inventario-service] consumer reserva-cancelada no iniciado — RabbitMQ no disponible');
    return;
  }

  await ch.assertQueue(QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': DLQ },
  });
  await ch.bindQueue(QUEUE, EXCHANGE, 'reservas.reserva.cancelada');
  await ch.prefetch(1);

  ch.consume(QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const { vehiculoId } = event.data as { vehiculoId?: string };

      if (vehiculoId) {
        await prisma.vehiculo.update({
          where: { id: vehiculoId },
          data:  { status: 'DISPONIBLE' },
        });
        console.log(`[inventario-service] ✅ vehiculo ${vehiculoId} → DISPONIBLE (reserva cancelada)`);
      }

      ch.ack(msg);
    } catch (err) {
      console.error('[inventario-service] consumer reserva-cancelada error:', err);
      ch.nack(msg, false, false);
    }
  });

  console.log(`[inventario-service] consumer escuchando → ${QUEUE}`);
}
