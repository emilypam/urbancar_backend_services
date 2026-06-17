import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { initSocketServer } from './shared/ws/socket-server.js';

const PORT = Number(process.env.PORT ?? 3007);
const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[bus-service] corriendo en http://localhost:${PORT}`);
  console.log(`[bus-service] RabbitMQ: ${process.env.RABBITMQ_URL ?? 'amqp://localhost'}`);
  console.log(`[bus-service] WebSocket: ws://localhost:${PORT}`);
});
