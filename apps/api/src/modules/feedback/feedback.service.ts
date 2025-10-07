import { prisma } from '../../shared/database/prisma';
import { SubmitFeedbackInput } from '@critical-ai-surveys/schemas';

export class FeedbackService {
  async submitFeedback(data: SubmitFeedbackInput) {
    // Also update the session to mark it as completed
    await prisma.session.update({
      where: { id: data.sessionId },
      data: { completedAt: new Date() },
    });

    return prisma.platformFeedback.create({
      data: {
        sessionId: data.sessionId,
        experienceRating: data.experienceRating,
        aiConversationRating: data.aiConversationRating,
        suggestions: data.suggestions,
      },
    });
  }
}