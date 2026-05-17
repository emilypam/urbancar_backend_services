export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UrbanCar — Financiero Service',
    version: '1.0.0',
    description: 'Gestión de pagos y facturas.',
  },
  servers: [
    { url: 'http://localhost:3005', description: 'Local' },
    { url: 'https://urbancar-financiero.azurewebsites.net', description: 'Azure (producción)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      PagoCreate: {
        type: 'object',
        required: ['reservaId', 'monto', 'metodoPago'],
        properties: {
          reservaId:  { type: 'string', format: 'uuid' },
          monto:      { type: 'number', minimum: 0.01, example: 180.00 },
          metodoPago: { type: 'string', example: 'TARJETA', enum: ['TARJETA', 'EFECTIVO', 'TRANSFERENCIA'] },
          referencia: { type: 'string', example: 'TXN-20260601-001' },
        },
      },
      PagoUpdate: {
        type: 'object',
        properties: {
          status:     { type: 'string', enum: ['PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO'] },
          referencia: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/v1/emilypamela/pagos': {
      get: {
        tags: ['Pagos'],
        summary: 'Listar pagos (autenticado)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',      in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',     in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'reservaId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status',    in: 'query', schema: { type: 'string', enum: ['PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO'] } },
        ],
        responses: { 200: { description: 'Lista paginada de pagos' } },
      },
      post: {
        tags: ['Pagos'],
        summary: 'Registrar pago (autenticado)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PagoCreate' } } },
        },
        responses: {
          201: { description: 'Pago registrado' },
          400: { description: 'Datos inválidos' },
          404: { description: 'Reserva no encontrada' },
        },
      },
    },
    '/api/v1/emilypamela/pagos/{id}': {
      get: {
        tags: ['Pagos'],
        summary: 'Obtener pago por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Pago encontrado' }, 404: { description: 'No encontrado' } },
      },
      patch: {
        tags: ['Pagos'],
        summary: 'Actualizar estado de pago (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PagoUpdate' } } },
        },
        responses: { 200: { description: 'Estado actualizado' } },
      },
    },
    '/api/v1/emilypamela/facturas': {
      get: {
        tags: ['Facturas'],
        summary: 'Listar facturas (autenticado)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',      in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',     in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'reservaId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Lista de facturas' } },
      },
    },
    '/api/v1/emilypamela/facturas/{id}': {
      get: {
        tags: ['Facturas'],
        summary: 'Obtener factura por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Factura encontrada' }, 404: { description: 'No encontrada' } },
      },
    },

    // ── Booking Integration ─────────────────────────────────────────────────
    '/api/v1/emilypamela/payment/booking/{reservaId}': {
      get: {
        tags: ['Booking Integration'],
        summary: 'Consultar pagos de una reserva (formato Booking)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reservaId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Resumen de pagos: lista de pagos, total pagado y estado consolidado',
          },
        },
      },
    },
  },
};
