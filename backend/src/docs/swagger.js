import swaggerJsdoc from 'swagger-jsdoc';
import { components } from './schemas.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TherapEase API',
    version: '1.0.0',
    description: 'API documentation for TherapEase backend'
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001',
      description: 'Local server'
    }
  ],
  components,
  security: [{ bearerAuth: [] }]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;