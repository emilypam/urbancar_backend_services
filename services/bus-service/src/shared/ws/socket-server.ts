import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[ws] cliente conectado: ${socket.id} (total: ${io!.engine.clientsCount})`);
    socket.on('disconnect', () => {
      console.log(`[ws] cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function broadcast(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
  }
}
