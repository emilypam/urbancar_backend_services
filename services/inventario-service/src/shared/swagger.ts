export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UrbanCar — Inventario Service',
    version: '1.0.0',
    description: 'Gestión de vehículos, marcas, modelos, categorías, combustibles, transmisiones y extras.',
  },
  servers: [
    { url: 'http://localhost:3002', description: 'Local' },
    { url: 'https://urbancar-inventario.azurewebsites.net', description: 'Azure (producción)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      VehiculoCreate: {
        type: 'object',
        required: ['agenciaId', 'modeloId', 'categoriaId', 'tipoCombustibleId', 'tipoTransmisionId', 'placa', 'anio', 'precioDia'],
        properties: {
          agenciaId:         { type: 'string', format: 'uuid' },
          modeloId:          { type: 'string', format: 'uuid' },
          categoriaId:       { type: 'string', format: 'uuid' },
          tipoCombustibleId: { type: 'string', format: 'uuid' },
          tipoTransmisionId: { type: 'string', format: 'uuid' },
          placa:             { type: 'string', example: 'ABC-1234' },
          color:             { type: 'string', example: 'Rojo' },
          anio:              { type: 'integer', example: 2022 },
          kilometraje:       { type: 'integer', example: 15000 },
          numeroPasajeros:   { type: 'integer', example: 5 },
          precioDia:         { type: 'number', example: 45.00 },
          imagenUrl:         { type: 'string', format: 'uri' },
          descripcion:       { type: 'string' },
        },
      },
      VehiculoUpdate: {
        type: 'object',
        properties: {
          placa:      { type: 'string' },
          precioDia:  { type: 'number' },
          status:     { type: 'string', enum: ['DISPONIBLE', 'RESERVADO', 'EN_USO', 'MANTENIMIENTO', 'INACTIVO'] },
          color:      { type: 'string' },
          kilometraje:{ type: 'integer' },
        },
      },
      MarcaCreate: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', example: 'Toyota' },
          logoUrl:{ type: 'string', format: 'uri' },
        },
      },
      ModeloCreate: {
        type: 'object',
        required: ['nombre', 'marcaId'],
        properties: {
          nombre:  { type: 'string', example: 'Corolla' },
          marcaId: { type: 'string', format: 'uuid' },
        },
      },
      CategoriaCreate: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre:      { type: 'string', example: 'SUV' },
          descripcion: { type: 'string' },
        },
      },
      ExtraCreate: {
        type: 'object',
        required: ['nombre', 'precioDia'],
        properties: {
          nombre:      { type: 'string', example: 'GPS' },
          descripcion: { type: 'string' },
          precioDia:   { type: 'number', example: 5.00 },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data:    { },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/v1/emilypamela/vehiculos': {
      get: {
        tags: ['Vehículos'],
        summary: 'Listar vehículos (público)',
        parameters: [
          { name: 'page',       in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',      in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status',     in: 'query', schema: { type: 'string', enum: ['DISPONIBLE', 'RESERVADO', 'EN_USO', 'MANTENIMIENTO', 'INACTIVO'] } },
          { name: 'categoriaId',in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'agenciaId',  in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Lista paginada de vehículos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
      post: {
        tags: ['Vehículos'],
        summary: 'Crear vehículo (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VehiculoCreate' } } },
        },
        responses: {
          201: { description: 'Vehículo creado' },
          400: { description: 'Datos inválidos' },
          403: { description: 'Acceso denegado' },
        },
      },
    },
    '/api/v1/emilypamela/vehiculos/{id}': {
      get: {
        tags: ['Vehículos'],
        summary: 'Obtener vehículo por ID (público)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Vehículo encontrado' },
          404: { description: 'No encontrado' },
        },
      },
      put: {
        tags: ['Vehículos'],
        summary: 'Actualizar vehículo (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VehiculoUpdate' } } },
        },
        responses: {
          200: { description: 'Actualizado' },
          404: { description: 'No encontrado' },
        },
      },
      delete: {
        tags: ['Vehículos'],
        summary: 'Eliminar vehículo (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Eliminado' },
          404: { description: 'No encontrado' },
        },
      },
    },
    '/api/v1/emilypamela/marcas': {
      get: {
        tags: ['Catálogos'],
        summary: 'Listar marcas (público)',
        responses: { 200: { description: 'Lista de marcas' } },
      },
      post: {
        tags: ['Catálogos'],
        summary: 'Crear marca (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MarcaCreate' } } } },
        responses: { 201: { description: 'Marca creada' }, 409: { description: 'Ya existe' } },
      },
    },
    '/api/v1/emilypamela/marcas/{id}': {
      put: {
        tags: ['Catálogos'],
        summary: 'Actualizar marca (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MarcaCreate' } } } },
        responses: { 200: { description: 'Actualizada' } },
      },
      delete: {
        tags: ['Catálogos'],
        summary: 'Eliminar marca (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Eliminada' } },
      },
    },
    '/api/v1/emilypamela/modelos': {
      get: {
        tags: ['Catálogos'],
        summary: 'Listar modelos (público)',
        parameters: [{ name: 'marcaId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Lista de modelos' } },
      },
      post: {
        tags: ['Catálogos'],
        summary: 'Crear modelo (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ModeloCreate' } } } },
        responses: { 201: { description: 'Modelo creado' } },
      },
    },
    '/api/v1/emilypamela/categorias': {
      get: {
        tags: ['Catálogos'],
        summary: 'Listar categorías (público)',
        responses: { 200: { description: 'Lista de categorías' } },
      },
      post: {
        tags: ['Catálogos'],
        summary: 'Crear categoría (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoriaCreate' } } } },
        responses: { 201: { description: 'Categoría creada' } },
      },
    },
    '/api/v1/emilypamela/extras': {
      get: {
        tags: ['Catálogos'],
        summary: 'Listar extras (público)',
        responses: { 200: { description: 'Lista de extras' } },
      },
      post: {
        tags: ['Catálogos'],
        summary: 'Crear extra (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExtraCreate' } } } },
        responses: { 201: { description: 'Extra creado' } },
      },
    },
    '/api/v1/emilypamela/tipos-combustible': {
      get: {
        tags: ['Catálogos'],
        summary: 'Listar tipos de combustible (público)',
        responses: { 200: { description: 'Lista' } },
      },
    },
    '/api/v1/emilypamela/tipos-transmision': {
      get: {
        tags: ['Catálogos'],
        summary: 'Listar tipos de transmisión (público)',
        responses: { 200: { description: 'Lista' } },
      },
    },

    // ── Booking Integration ─────────────────────────────────────────────────
    '/api/v1/emilypamela/vehiculos/booking': {
      get: {
        tags: ['Booking Integration'],
        summary: 'Listar vehículos disponibles (formato Booking)',
        parameters: [
          { name: 'page',       in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',      in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'agenciaId',  in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'categoriaId',in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Lista de vehículos en formato Booking (precioPorDia, nombre compuesto, categoría plana)' },
        },
      },
    },
    '/api/v1/emilypamela/vehiculos/booking/{id}': {
      get: {
        tags: ['Booking Integration'],
        summary: 'Obtener vehículo por ID (formato Booking)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Vehículo en formato Booking' },
          404: { description: 'No encontrado' },
        },
      },
    },
    '/api/v1/emilypamela/vehiculos/booking/{id}/disponibilidad': {
      get: {
        tags: ['Booking Integration'],
        summary: 'Verificar disponibilidad de vehículo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Estado de disponibilidad del vehículo' },
          404: { description: 'No encontrado' },
        },
      },
    },
  },
};
