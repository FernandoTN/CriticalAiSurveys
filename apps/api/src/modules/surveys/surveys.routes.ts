import { FastifyInstance } from 'fastify';
import { SurveyController } from './surveys.controller';
import { SurveyService } from './surveys.service';

export async function surveyRoutes(fastify: FastifyInstance) {
  const surveyService = new SurveyService();
  const surveyController = new SurveyController(surveyService);

  fastify.post('/surveys', surveyController.createSurvey.bind(surveyController));
  fastify.get('/surveys/:id', surveyController.getSurveyById.bind(surveyController));
  fastify.patch('/surveys/:id', surveyController.updateSurvey.bind(surveyController));
  fastify.post(
    '/surveys/:id/publish',
    surveyController.publishSurvey.bind(surveyController)
  );
}