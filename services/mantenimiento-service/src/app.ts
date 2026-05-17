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

app.use(errorHandler);

export default app;
