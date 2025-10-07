import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from './sessions.service';
import { createSessionSchema } from '@critical-ai-surveys/schemas';

export class SessionController {
  constructor(private sessionService: SessionService) {}

  async createAnonymousSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = createSessionSchema.parse(request.body);
      const session = await this.sessionService.createAnonymousSession(validatedData);
      reply.code(201).send(session);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed', details: error });
    }
  }
}