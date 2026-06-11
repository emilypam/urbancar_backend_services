// Routing keys para el exchange urbancar.events (topic)
// Formato: {dominio}.{agregado}.{evento}
export type RoutingKey =
  | 'reservas.reserva.creada'
  | 'reservas.reserva.confirmada'
  | 'reservas.reserva.cancelada'
  | 'reservas.reserva.completada'
  | 'pagos.pago.procesado'
  | 'pagos.pago.fallido'
  | 'facturas.factura.generada'
  | 'alquileres.alquiler.iniciado'
  | 'alquileres.devolucion.registrada'
  | 'mantenimiento.vehiculo.en_mantenimiento'
  | 'mantenimiento.vehiculo.disponible'
  | 'mantenimiento.kardex.registrado';

// Alias de compatibilidad con v1 (orquestador usa estos strings)
export type EventType =
  | 'RESERVA_CREADA'
  | 'RESERVA_CANCELADA'
  | 'ALQUILER_INICIADO'
  | 'ALQUILER_CANCELADO'
  | 'DEVOLUCION_REGISTRADA';

export const EVENT_TYPE_TO_ROUTING_KEY: Record<EventType, RoutingKey> = {
  RESERVA_CREADA:      'reservas.reserva.creada',
  RESERVA_CANCELADA:   'reservas.reserva.cancelada',
  ALQUILER_INICIADO:   'alquileres.alquiler.iniciado',
  ALQUILER_CANCELADO:  'reservas.reserva.cancelada',
  DEVOLUCION_REGISTRADA: 'alquileres.devolucion.registrada',
};

export interface DomainEvent {
  eventId:       string;
  eventType:     string;
  eventVersion:  string;
  timestamp:     string;
  correlationId: string;
  source:        string;
  usuarioId:     string;
  data:          Record<string, unknown>;
}
