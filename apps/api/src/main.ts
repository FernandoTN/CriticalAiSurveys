import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { surveyRoutes } from './modules/surveys/surveys.routes';
import { sessionRoutes } from './modules/sessions/sessions.routes';
import { responseRoutes } from './modules/responses/responses.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { voteRoutes } from './modules/votes/votes.routes';
import { feedbackRoutes } from './modules/feedback/feedback.routes';
import appEmitter from './shared/events/emitter';
import { ResponseService } from './modules/responses/responses.service';
import { Response } from '@prisma/client';

const server = Fastify({
  logger: true,
});

server.register(cors, { origin: '*' });
server.register(websocket);

server.get('/health', { logger: false }, async () => ({ status: 'ok' }));

server.register(async (fastify) => {
  const responseService = new ResponseService();

  // Register all HTTP routes
  fastify.register(surveyRoutes);
  fastify.register(sessionRoutes);
  fastify.register(responseRoutes);
  fastify.register(chatRoutes);
  fastify.register(voteRoutes);
  fastify.register(feedbackRoutes);

  // WebSocket route for real-time updates
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    console.log('Client connected to WebSocket');
    connection.socket.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Listen for events to broadcast WebSocket messages
  appEmitter.on('response.submitted', async (response: Response) => {
    if (response.questionId) {
      const distribution = await responseService.getOpinionDistribution(response.questionId);

      const payload = JSON.stringify({
        type: 'distribution_update',
        questionId: response.questionId,
        distribution,
      });

      fastify.websocketServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(payload);
        }
      });
    }
  });

}, { prefix: '/api/v1' });

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