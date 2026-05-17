export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UrbanCar — Auth Service',
    version: '1.0.0',
    description: 'Microservicio de autenticación y gestión de usuarios.',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local' },
    { url: 'https://urbancar-auth.azurewebsites.net', description: 'Azure (producción)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      RegisterDto: {
        type: 'object',
        required: ['email', 'password', 'nombres', 'apellidos'],
        properties: {
          email:     { type: 'string', format: 'email', example: 'cliente@urban.com' },
          password:  { type: 'string', minLength: 6, example: '123456' },
        
        },
      },
      LoginDto: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'admin@urban.com' },
          password: { type: 'string', example: '123456' },
        },
      },
      UpdateUsuarioDto: {
        type: 'object',
        properties: {
          nombres:   { type: 'string' },
          apellidos: { type: 'string' },
          telefono:  { type: 'string' },
          ciudadId:  { type: 'string', format: 'uuid' },
          isActive:  { type: 'boolean' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user:  {
                type: 'object',
                properties: {
                  id:       { type: 'string', format: 'uuid' },
                  email:    { type: 'string' },
                  nombres:  { type: 'string' },
                  apellidos:{ type: 'string' },
                  role:     { type: 'string', enum: ['CLIENTE', 'ADMIN'] },
                },
              },
            },
          },
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
    '/api/v1/emilypamela/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar nuevo usuario',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterDto' } } },
        },
        responses: {
          201: { description: 'Usuario registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Datos inválidos',   content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email ya registrado' },
        },
      },
    },
    '/api/v1/emilypamela/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginDto' } } },
        },
        responses: {
          200: { description: 'Login exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Credenciales incorrectas' },
        },
      },
    },
    '/api/v1/emilypamela/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil del usuario' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/api/v1/emilypamela/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role',  in: 'query', schema: { type: 'string', enum: ['ADMIN', 'CLIENTE'] } },
        ],
        responses: {
          200: { description: 'Lista de usuarios' },
          403: { description: 'Acceso denegado' },
        },
      },
    },
    '/api/v1/emilypamela/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Usuario encontrado' },
          404: { description: 'No encontrado' },
        },
      },
      patch: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUsuarioDto' } } },
        },
        responses: {
          200: { description: 'Usuario actualizado' },
          404: { description: 'No encontrado' },
        },
      },
    },
  },
};
