import { randomUUID } from 'crypto';
import { getChannel, isConnected, EXCHANGE } from './rabbitmq.js';
import { EventType, DomainEvent, EVENT_TYPE_TO_ROUTING_KEY } from './event-types.js';

const inMemoryLog: DomainEvent[] = [];

export async function publishEvent(
  tipo: EventType,
  usuarioId: string,
  correlationId: string,
  data: Record<string, unknown>,
): Promise<DomainEvent> {
  const routingKey = EVENT_TYPE_TO_ROUTING_KEY[tipo];

  const event: DomainEvent = {
    eventId:      randomUUID(),
    eventType:    routingKey,
    eventVersion: '2.0',
    timestamp:    new Date().toISOString(),
    correlationId,
    source:       'bus-service',
    usuarioId,
    data,
  };

  const ch = getChannel();
  if (ch) {
    ch.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { contentType: 'application/json', persistent: true, messageId: event.eventId },
    );
    console.log(`[bus-service] ✉️  ${routingKey} → ${event.eventId}`);
  } else {
    console.log('[bus-service][local-event]', JSON.stringify(event));
  }

  inMemoryLog.unshift(event);
  if (inMemoryLog.length > 200) inMemoryLog.pop();

  return event;
}

export function isSenderConnected(): boolean {
  return isConnected();
}

export function getEventLog(page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    items:      inMemoryLog.slice(start, start + limit),
    total:      inMemoryLog.length,
    page,
    limit,
    totalPages: Math.ceil(inMemoryLog.length / limit),
  };
}
