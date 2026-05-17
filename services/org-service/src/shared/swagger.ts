export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UrbanCar — Org Service',
    version: '1.0.0',
    description: 'Gestión de empresas, agencias, provincias y ciudades.',
  },
  servers: [
    { url: 'http://localhost:3003', description: 'Local' },
    { url: 'https://urbancar-org.azurewebsites.net', description: 'Azure (producción)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      EmpresaCreate: {
        type: 'object',
        required: ['nombre', 'ruc'],
        properties: {
          nombre:   { type: 'string', example: 'UrbanCar S.A.' },
          ruc:      { type: 'string', example: '1790012345001' },
          email:    { type: 'string', format: 'email' },
          telefono: { type: 'string' },
          logoUrl:  { type: 'string', format: 'uri' },
        },
      },
      AgenciaCreate: {
        type: 'object',
        required: ['empresaId'],
        properties: {
          empresaId: { type: 'string', format: 'uuid' },
          ciudadId:  { type: 'string', format: 'uuid' },
          nombre:    { type: 'string', example: 'Sucursal Norte' },
          direccion: { type: 'string' },
          telefono:  { type: 'string' },
          email:     { type: 'string', format: 'email' },
        },
      },
      ProvinciaCreate: {
        type: 'object',
        required: ['nombre', 'codigo'],
        properties: {
          nombre: { type: 'string', example: 'Pichincha' },
          codigo: { type: 'string', example: 'P' },
        },
      },
      CiudadCreate: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre:      { type: 'string', example: 'Quito' },
          provinciaId: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
  paths: {
    '/api/v1/emilypamela/empresas': {
      get: {
        tags: ['Empresas'],
        summary: 'Listar empresas (público)',
        responses: { 200: { description: 'Lista de empresas' } },
      },
      post: {
        tags: ['Empresas'],
        summary: 'Crear empresa (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EmpresaCreate' } } } },
        responses: { 201: { description: 'Empresa creada' }, 409: { description: 'RUC ya registrado' } },
      },
    },
    '/api/v1/emilypamela/empresas/{id}': {
      get: {
        tags: ['Empresas'],
        summary: 'Obtener empresa por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Empresa encontrada' }, 404: { description: 'No encontrada' } },
      },
      put: {
        tags: ['Empresas'],
        summary: 'Actualizar empresa (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EmpresaCreate' } } } },
        responses: { 200: { description: 'Actualizada' } },
      },
      delete: {
        tags: ['Empresas'],
        summary: 'Eliminar empresa (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Eliminada' } },
      },
    },
    '/api/v1/emilypamela/agencias': {
      get: {
        tags: ['Agencias'],
        summary: 'Listar agencias (público)',
        parameters: [{ name: 'empresaId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Lista de agencias' } },
      },
      post: {
        tags: ['Agencias'],
        summary: 'Crear agencia (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AgenciaCreate' } } } },
        responses: { 201: { description: 'Agencia creada' } },
      },
    },
    '/api/v1/emilypamela/agencias/{id}': {
      get: {
        tags: ['Agencias'],
        summary: 'Obtener agencia por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Agencia encontrada' }, 404: { description: 'No encontrada' } },
      },
      put: {
        tags: ['Agencias'],
        summary: 'Actualizar agencia (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AgenciaCreate' } } } },
        responses: { 200: { description: 'Actualizada' } },
      },
    },
    '/api/v1/emilypamela/provincias': {
      get: {
        tags: ['Ubicaciones'],
        summary: 'Listar provincias (público)',
        responses: { 200: { description: 'Lista de provincias' } },
      },
      post: {
        tags: ['Ubicaciones'],
        summary: 'Crear provincia (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProvinciaCreate' } } } },
        responses: { 201: { description: 'Provincia creada' } },
      },
    },
    '/api/v1/emilypamela/ciudades': {
      get: {
        tags: ['Ubicaciones'],
        summary: 'Listar ciudades (público)',
        parameters: [{ name: 'provinciaId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Lista de ciudades' } },
      },
      post: {
        tags: ['Ubicaciones'],
        summary: 'Crear ciudad (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CiudadCreate' } } } },
        responses: { 201: { description: 'Ciudad creada' } },
      },
    },
  },
};
