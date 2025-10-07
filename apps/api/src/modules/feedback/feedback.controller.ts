import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedbackService } from './feedback.service';
import { submitFeedbackSchema } from '@critical-ai-surveys/schemas';

export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  async submitFeedback(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = submitFeedbackSchema.parse(request.body);
      const feedback = await this.feedbackService.submitFeedback(validatedData);
      reply.code(201).send(feedback);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed', details: error });
    }
  }
}