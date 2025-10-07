import { FastifyInstance } from 'fastify';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

export async function feedbackRoutes(fastify: FastifyInstance) {
  const feedbackService = new FeedbackService();
  const feedbackController = new FeedbackController(feedbackService);

  fastify.post(
    '/feedback',
    feedbackController.submitFeedback.bind(feedbackController)
  );
}