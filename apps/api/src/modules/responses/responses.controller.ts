import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseService } from './responses.service';
import { submitResponseSchema, updateResponseSchema } from '@critical-ai-surveys/schemas';

export class ResponseController {
  constructor(private responseService: ResponseService) {}

  async submitResponse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = submitResponseSchema.parse(request.body);
      const response = await this.responseService.submitResponse(validatedData);
      reply.code(201).send(response);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed', details: error });
    }
  }

  async updateResponse(
    request: FastifyRequest<{ Params: { responseId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const validatedData = updateResponseSchema.parse(request.body);
      const response = await this.responseService.updateResponse(
        request.params.responseId,
        validatedData
      );
      reply.send(response);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed or resource not found', details: error });
    }
  }
}