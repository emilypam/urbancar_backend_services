import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createPagoRouter }    from './modules/pagos/pago.routes.js';
import { createFacturaRouter } from './modules/facturas/factura.routes.js';
import { pagoRepository, pagoController, facturaController } from './shared/container.js';
import { createPaymentBookingRouter } from './modules/booking-integration/payment-booking.routes.js';
import { errorHandler } from './shared/errors/error.middleware.js';
import { swaggerSpec } from './shared/swagger.js';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import { createPagoV2Router } from './modules/pagos/v2/pago.routes.v2.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'financiero-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Booking integration route
app.use('/api/v1/emilypamela/payment/booking', createPaymentBookingRouter(pagoRepository));

app.use('/api/v1/emilypamela/pagos',    createPagoRouter(pagoController));
app.use('/api/v1/emilypamela/facturas', createFacturaRouter(facturaController));

// V2 — pagos con mensajería RabbitMQ
connectRabbitMQ('financiero-service');
app.use('/api/v2/emilypamela/pagos', createPagoV2Router());

app.use(errorHandler);

export default app;
