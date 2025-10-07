import { FastifyInstance } from 'fastify';
import { VoteController } from './votes.controller';
import { VoteService } from './votes.service';

export async function voteRoutes(fastify: FastifyInstance) {
  const voteService = new VoteService();
  const voteController = new VoteController(voteService);

  fastify.get(
    '/surveys/:surveyId/voting-queue',
    voteController.getVotingQueue.bind(voteController)
  );

  fastify.post(
    '/votes',
    voteController.submitVote.bind(voteController)
  );
}