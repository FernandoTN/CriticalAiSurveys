import { FastifyRequest, FastifyReply } from 'fastify';
import { VoteService } from './votes.service';
import { submitVoteSchema } from '@critical-ai-surveys/schemas';

export class VoteController {
  constructor(private voteService: VoteService) {}

  async getVotingQueue(
    request: FastifyRequest<{ Params: { surveyId: string }; Querystring: { sessionId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { surveyId } = request.params;
      const { sessionId } = request.query;
      const queue = await this.voteService.getVotingQueue(surveyId, sessionId);
      reply.send(queue);
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get voting queue', details: error });
    }
  }

  async submitVote(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = submitVoteSchema.parse(request.body);
      const vote = await this.voteService.submitVote(validatedData);
      reply.code(201).send(vote);
    } catch (error) {
      reply.code(400).send({ error: 'Validation failed', details: error });
    }
  }
}