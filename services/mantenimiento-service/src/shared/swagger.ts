export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UrbanCar — Mantenimiento Service',
    version: '1.0.0',
    description: 'Gestión de mantenimientos, kardex de vehículos y sistemas externos integrados.',
  },
  servers: [
    { url: 'http://localhost:3006', description: 'Local' },
    { url: 'https://urbancar-mantenimiento.azurewebsites.net', description: 'Azure (producción)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      MantenimientoCreate: {
        type: 'object',
        required: ['vehiculoId', 'tipo', 'fechaInicio'],
        properties: {
          vehiculoId:  { type: 'string', format: 'uuid' },
          tipo:        { type: 'string', example: 'Cambio de aceite' },
          descripcion: { type: 'string' },
          fechaInicio: { type: 'string', format: 'date-time', example: '2026-06-01T08:00:00Z' },
          fechaFin:    { type: 'string', format: 'date-time' },
          costo:       { type: 'number', minimum: 0, example: 85.00 },
          tecnico:     { type: 'string', example: 'Carlos Rodríguez' },
        },
      },
      SistemaExternoCreate: {
        type: 'object',
        required: ['nombre', 'urlBase'],
        properties: {
          nombre:      { type: 'string', example: 'Sistema Booking Prototipo' },
          urlBase:     { type: 'string', format: 'uri', example: 'https://booking.example.com/api/v1' },
          descripcion: { type: 'string' },
          apiKey:      { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/v1/emilypamela/mantenimientos': {
      get: {
        tags: ['Mantenimientos'],
        summary: 'Listar mantenimientos (autenticado)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',       in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',      in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'vehiculoId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Lista de mantenimientos' } },
      },
      post: {
        tags: ['Mantenimientos'],
        summary: 'Crear mantenimiento (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MantenimientoCreate' } } },
        },
        responses: { 201: { description: 'Mantenimiento registrado' }, 400: { description: 'Datos inválidos' } },
      },
    },
    '/api/v1/emilypamela/mantenimientos/{id}': {
      get: {
        tags: ['Mantenimientos'],
        summary: 'Obtener mantenimiento por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Mantenimiento encontrado' }, 404: { description: 'No encontrado' } },
      },
      put: {
        tags: ['Mantenimientos'],
        summary: 'Actualizar mantenimiento (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MantenimientoCreate' } } },
        },
        responses: { 200: { description: 'Actualizado' } },
      },
    },
    '/api/v1/emilypamela/kardex': {
      get: {
        tags: ['Kardex'],
        summary: 'Historial de estado de vehículos (autenticado)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'vehiculoId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'page',       in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',      in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Historial kardex' } },
      },
    },
    '/api/v1/emilypamela/sistemas-externos': {
      get: {
        tags: ['Sistemas Externos'],
        summary: 'Listar sistemas externos integrados (autenticado)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de sistemas externos' } },
      },
      post: {
        tags: ['Sistemas Externos'],
        summary: 'Registrar sistema externo (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SistemaExternoCreate' } } },
        },
        responses: { 201: { description: 'Sistema externo registrado' } },
      },
    },
    '/api/v1/emilypamela/sistemas-externos/{id}': {
      get: {
        tags: ['Sistemas Externos'],
        summary: 'Obtener sistema externo por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Sistema encontrado' }, 404: { description: 'No encontrado' } },
      },
      put: {
        tags: ['Sistemas Externos'],
        summary: 'Actualizar sistema externo (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SistemaExternoCreate' } } },
        },
        responses: { 200: { description: 'Actualizado' } },
      },
      delete: {
        tags: ['Sistemas Externos'],
        summary: 'Eliminar sistema externo (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Eliminado' } },
      },
    },
  },
};
