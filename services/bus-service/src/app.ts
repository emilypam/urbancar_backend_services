import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createOrchestratorRouter } from './modules/orchestrator/orchestrator.routes.js';
import { isSenderConnected } from './shared/bus/service-bus.js';
import { connectRabbitMQ } from './shared/bus/rabbitmq.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

connectRabbitMQ('bus-service');

app.get('/health', (_req, res) => {
  res.json({
    service:   'bus-service',
    status:    'ok',
    transport: 'rabbitmq',
    connected: isSenderConnected(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/emilypamela/bus', createOrchestratorRouter());

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[bus-service] error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message ?? 'Error interno' } });
});

export default app;
