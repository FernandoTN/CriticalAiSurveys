import { z } from 'zod';

// Schema for submitting platform feedback
export const submitFeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  experienceRating: z.number().int().min(1).max(5),
  aiConversationRating: z.enum(['very_helpful', 'somewhat_helpful', 'not_helpful', 'distracting']).optional(),
  suggestions: z.string().max(2000).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;