import { z } from 'zod';

// Base schema for any question
const baseQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(1000).optional(),
  orderIndex: z.number().int(),
});

// Schema for Likert scale questions
export const likertQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('likert'),
  options: z.object({
    scale: z.array(z.number().int()).min(2).max(10),
    labels: z.array(z.string()).min(2),
  }),
  validation: z.object({
    required: z.boolean().default(true),
  }),
});

// Schema for free-text questions
export const freeTextQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('free_text'),
  options: z.object({}).optional(),
  validation: z.object({
    required: z.boolean().default(true),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
  }),
});

// A discriminated union to handle different question types
export const questionSchema = z.discriminatedUnion('type', [
  likertQuestionSchema,
  freeTextQuestionSchema,
]);

// Type definition for a question
export type Question = z.infer<typeof questionSchema>;

// Schema for creating a new survey
export const createSurveySchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
});

// Schema for updating a survey
export const updateSurveySchema = z.object({
  title: z.string().min(1, "Title is required").max(500).optional(),
  description: z.string().max(5000).optional(),
  questions: z.array(questionSchema).optional(),
  settings: z.object({
    visibility: z.enum(['public', 'private', 'unlisted']).optional(),
    enableAI: z.boolean().optional(),
  }).optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;