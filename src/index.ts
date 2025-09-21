import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, validateConfig } from './config';
import { databaseConnection } from './database/connection';
import { taskRoutes } from './routes/tasks';

// Validate configuration on startup
validateConfig();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.server.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// Register CORS plugin
fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const dbStatus = databaseConnection.getConnectionStatus();
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
    environment: config.server.nodeEnv,
  };
});

// Register API routes
fastify.register(async function (fastify) {
  // Register task routes under /api prefix
  fastify.register(taskRoutes, { prefix: '/api' });
}, { prefix: '' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  // Handle validation errors
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      statusCode: 400,
    });
    return;
  }
  
  // Handle other errors
  reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    statusCode: 500,
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    await databaseConnection.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async (): Promise<void> => {
  try {
    // Connect to database
    await databaseConnection.connect();
    
    // Start server
    await fastify.listen({
      port: config.server.port,
      host: '0.0.0.0', // Listen on all interfaces
    });
    
    console.log(`🚀 Server is running on http://localhost:${config.server.port}`);
    console.log(`📊 Health check: http://localhost:${config.server.port}/health`);
    console.log(`🔗 API base URL: ${config.api.baseUrl}`);
    console.log(`🌍 Environment: ${config.server.nodeEnv}`);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
start();
