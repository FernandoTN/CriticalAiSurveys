import { FastifyInstance } from 'fastify';
import { SessionController } from './sessions.controller';
import { SessionService } from './sessions.service';

export async function sessionRoutes(fastify: FastifyInstance) {
  const sessionService = new SessionService();
  const sessionController = new SessionController(sessionService);

  fastify.post(
    '/auth/session',
    sessionController.createAnonymousSession.bind(sessionController)
  );
}