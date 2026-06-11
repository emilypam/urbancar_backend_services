import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_HOST } from '../config';

export type WsEvent =
  | 'reserva:creada'
  | 'reserva:confirmada'
  | 'reserva:cancelada'
  | 'reserva:completada'
  | 'pago:procesado'
  | 'pago:fallido'
  | 'vehiculo:actualizado';

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(API_HOST, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    sharedSocket.on('connect',    () => console.log('[socket] conectado al bus-service'));
    sharedSocket.on('disconnect', () => console.log('[socket] desconectado'));
    sharedSocket.on('connect_error', (e: Error) => console.warn('[socket] error:', e.message));
  }
  return sharedSocket;
}

export function useSocket(
  events: WsEvent[],
  callback: (event: WsEvent) => void,
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const socket = getSocket();
    const handlers: Array<[string, () => void]> = events.map((evt) => {
      const handler = () => cbRef.current(evt);
      socket.on(evt, handler);
      return [evt, handler];
    });
    return () => {
      handlers.forEach(([evt, handler]) => socket.off(evt, handler as any));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
