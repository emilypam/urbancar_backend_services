import 'dotenv/config';
import app from './app.js';

const PORT = Number(process.env.PORT ?? 3007);

app.listen(PORT, () => {
  console.log(`[bus-service] corriendo en http://localhost:${PORT}`);
  console.log(`[bus-service] RabbitMQ: ${process.env.RABBITMQ_URL ?? 'amqp://localhost'}`);
});
