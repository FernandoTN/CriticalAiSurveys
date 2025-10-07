import { prisma } from '../../shared/database/prisma';
import { SubmitVoteInput } from '@critical-ai-surveys/schemas';

export class VoteService {
  /**
   * Fetches a queue of responses for a user to vote on.
   * It excludes the user's own responses and responses they have already voted on.
   */
  async getVotingQueue(surveyId: string, sessionId: string) {
    // Find responses the current user has already voted on
    const votedResponseIds = await prisma.vote.findMany({
      where: { sessionId },
      select: { targetResponseId: true },
    }).then(votes => votes.map(v => v.targetResponseId).filter(id => id !== null) as string[]);

    // Find the user's own responses
    const userResponseIds = await prisma.response.findMany({
      where: { sessionId },
      select: { id: true },
    }).then(responses => responses.map(r => r.id));

    // Fetch responses from the same survey, excluding own and already voted ones
    return prisma.response.findMany({
      where: {
        session: {
          surveyId: surveyId,
        },
        id: {
          notIn: [...votedResponseIds, ...userResponseIds],
        },
        // Only get original responses, not edits
        editedFromId: null,
      },
      take: 10, // Get up to 10 responses for the queue
      select: {
        id: true,
        value: true, // Contains the justification text
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Or use a random order in a real scenario
      },
    });
  }

  /**
   * Submits a vote for a specific response.
   */
  async submitVote(data: SubmitVoteInput) {
    return prisma.vote.create({
      data: {
        targetResponseId: data.responseId,
        sessionId: data.sessionId,
        voteType: data.voteType,
        reason: data.reason,
      },
    });
  }
}