import { getChannel, EXCHANGE, DLQ } from '../rabbitmq.js';
import prisma from '../../shared/database/prisma.js';

const QUEUE = 'inventario.reservas.confirmadas';

export async function startReservaConfirmadaConsumer(): Promise<void> {
  const ch = getChannel();
  if (!ch) {
    console.warn('[inventario-service] consumer reserva-confirmada no iniciado — RabbitMQ no disponible');
    return;
  }

  await ch.assertQueue(QUEUE, {
    durable: true,
    arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': DLQ },
  });
  await ch.bindQueue(QUEUE, EXCHANGE, 'reservas.reserva.confirmada');
  await ch.prefetch(1);

  ch.consume(QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const { vehiculoId } = event.data as { vehiculoId?: string };

      if (vehiculoId) {
        await prisma.vehiculo.update({
          where: { id: vehiculoId },
          data:  { status: 'RESERVADO' },
        });
        console.log(`[inventario-service] ✅ vehiculo ${vehiculoId} → RESERVADO (confirmado)`);
      }

      ch.ack(msg);
    } catch (err) {
      console.error('[inventario-service] consumer reserva-confirmada error:', err);
      ch.nack(msg, false, false);
    }
  });

  console.log(`[inventario-service] consumer escuchando → ${QUEUE}`);
}
