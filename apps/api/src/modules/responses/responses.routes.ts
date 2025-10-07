import { FastifyInstance } from 'fastify';
import { ResponseController } from './responses.controller';
import { ResponseService } from './responses.service';

export async function responseRoutes(fastify: FastifyInstance) {
  const responseService = new ResponseService();
  const responseController = new ResponseController(responseService);

  fastify.post(
    '/surveys/:surveyId/responses',
    responseController.submitResponse.bind(responseController)
  );

  fastify.patch(
    '/responses/:responseId',
    responseController.updateResponse.bind(responseController)
  );

  fastify.get(
    '/surveys/:surveyId/distribution/:questionId',
    responseController.getOpinionDistribution.bind(responseController)
  );
}