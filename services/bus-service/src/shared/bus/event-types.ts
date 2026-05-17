export type EventType =
  | 'RESERVA_CREADA'
  | 'RESERVA_CANCELADA'
  | 'ALQUILER_INICIADO'
  | 'ALQUILER_CANCELADO'
  | 'DEVOLUCION_REGISTRADA';

export interface BusEvent {
  id: string;
  tipo: EventType;
  usuarioId: string;
  entidadId: string;
  payload: Record<string, unknown>;
  publicadoEn: string;
  destino: 'azure-service-bus' | 'local';
}
