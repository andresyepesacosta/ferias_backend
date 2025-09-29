import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ferias Backend API',
      version: '1.0.0',
      description: 'API para gestión de ferias, productos y ventas',
      contact: {
        name: 'Ferias Backend Team',
        email: 'support@ferias.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación'
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Autenticación por sesión (cookies)'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error'
            },
            message: {
              type: 'string',
              description: 'Descripción detallada del error'
            },
            statusCode: {
              type: 'integer',
              description: 'Código de estado HTTP'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de éxito'
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        sessionAuth: []
      }
    ]
  },
  apis: [
    './src/modules/*/routes/*.js',
    './src/modules/*/*.routes.js',
    './src/routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };