import Fastify from 'fastify';
import cors from '@fastify/cors';

const server = Fastify({
  logger: true,
});

// Register CORS plugin
server.register(cors, {
  origin: '*', // Allow all origins for development
});

// Health check route
server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: 8000, host: '0.0.0.0' });
    server.log.info(`Server listening on port 8000`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();