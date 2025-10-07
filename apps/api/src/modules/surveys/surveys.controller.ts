import { FastifyRequest, FastifyReply } from 'fastify';
import { SurveyService } from './surveys.service';
import { createSurveySchema, updateSurveySchema } from '@critical-ai-surveys/schemas';

export class SurveyController {
  constructor(private surveyService: SurveyService) {}

  async createSurvey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = createSurveySchema.parse(request.body);
      // Assuming a user ID is available from authentication middleware
      const userId = 'c1583518-c570-4496-a80c-032d87d95318'; // Placeholder
      const survey = await this.surveyService.createSurvey(validatedData, userId);
      reply.code(201).send(survey);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed', details: error });
    }
  }

  async getSurveyById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const survey = await this.surveyService.getSurveyById(request.params.id);
    if (!survey) {
      return reply.code(404).send({ error: 'Survey not found' });
    }
    reply.send(survey);
  }

  async getSurveyBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const survey = await this.surveyService.getSurveyBySlug(request.params.slug);
    if (!survey) {
      return reply.code(404).send({ error: 'Survey not found' });
    }
    reply.send(survey);
  }

  async updateSurvey(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const validatedData = updateSurveySchema.parse(request.body);
      const survey = await this.surveyService.updateSurvey(request.params.id, validatedData);
      reply.send(survey);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed', details: error });
    }
  }

  async publishSurvey(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const survey = await this.surveyService.publishSurvey(request.params.id);
    reply.send(survey);
  }
}