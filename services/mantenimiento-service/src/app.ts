import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createMantenimientoRouter }  from './modules/mantenimientos/mantenimiento.routes.js';
import { createKardexRouter }         from './modules/kardex/kardex.routes.js';
import { createSistemaExternoRouter } from './modules/sistemas/sistema-externo.routes.js';
import { mantenimientoController, kardexController, sistemaExternoController } from './shared/container.js';
import { errorHandler } from './shared/errors/error.middleware.js';
import { swaggerSpec } from './shared/swagger.js';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import { createMantenimientoV2Router } from './modules/mantenimientos/v2/mantenimiento.routes.v2.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'mantenimiento-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/emilypamela/mantenimientos',    createMantenimientoRouter(mantenimientoController));
app.use('/api/v1/emilypamela/kardex',            createKardexRouter(kardexController));
app.use('/api/v1/emilypamela/sistemas-externos', createSistemaExternoRouter(sistemaExternoController));

// V2 — mantenimientos con mensajería RabbitMQ
connectRabbitMQ('mantenimiento-service');
app.use('/api/v2/emilypamela/mantenimientos', createMantenimientoV2Router());

app.use(errorHandler);

export default app;
