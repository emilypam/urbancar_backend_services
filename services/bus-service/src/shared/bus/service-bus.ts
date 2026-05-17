import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { randomUUID } from 'crypto';
import { BusEvent, EventType } from './event-types.js';

const inMemoryLog: BusEvent[] = [];
let sender: ServiceBusSender | null = null;

function initSender(): void {
  const connStr = process.env.AZURE_SERVICEBUS_CONNECTION_STRING;
  const topic   = process.env.AZURE_SERVICEBUS_TOPIC ?? 'urbancar-eventos';
  if (!connStr) {
    console.warn('[bus-service] AZURE_SERVICEBUS_CONNECTION_STRING no configurado — modo local activo');
    return;
  }
  try {
    const client = new ServiceBusClient(connStr);
    sender = client.createSender(topic);
    console.log(`[bus-service] Azure Service Bus conectado → topic: ${topic}`);
  } catch (err) {
    console.error('[bus-service] Error al conectar Azure Service Bus:', err);
  }
}

initSender();

export async function publishEvent(
  tipo: EventType,
  usuarioId: string,
  entidadId: string,
  payload: Record<string, unknown>,
): Promise<BusEvent> {
  const event: BusEvent = {
    id: randomUUID(),
    tipo,
    usuarioId,
    entidadId,
    payload,
    publicadoEn: new Date().toISOString(),
    destino: sender ? 'azure-service-bus' : 'local',
  };

  if (sender) {
    await sender.sendMessages({ body: event, contentType: 'application/json', subject: tipo });
  } else {
    console.log('[bus-service][local-event]', JSON.stringify(event));
  }

  inMemoryLog.unshift(event);
  if (inMemoryLog.length > 200) inMemoryLog.pop();

  return event;
}

export function isSenderConnected(): boolean {
  return sender !== null;
}

export function getEventLog(page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    items: inMemoryLog.slice(start, start + limit),
    total: inMemoryLog.length,
    page,
    limit,
    totalPages: Math.ceil(inMemoryLog.length / limit),
  };
}
