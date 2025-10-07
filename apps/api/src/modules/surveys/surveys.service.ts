import { prisma } from '../../shared/database/prisma';
import { CreateSurveyInput, UpdateSurveyInput } from '@critical-ai-surveys/schemas';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

export class SurveyService {
  async createSurvey(data: CreateSurveyInput, userId: string) {
    const slug = `${data.title.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`;
    return prisma.survey.create({
      data: {
        ...data,
        slug,
        createdById: userId,
      },
    });
  }

  async getSurveyBySlug(slug: string) {
    return prisma.survey.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async getSurveyById(surveyId: string) {
    return prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
  }

  async updateSurvey(surveyId: string, data: UpdateSurveyInput) {
    const { questions, ...surveyData } = data;

    const transaction = [
      prisma.survey.update({
        where: { id: surveyId },
        data: surveyData,
      }),
    ];

    if (questions) {
      const questionCreates = questions
        .filter((q) => !q.id)
        .map((q) => prisma.surveyQuestion.create({ data: { ...q, surveyId } }));

      const questionUpdates = questions
        .filter((q) => q.id)
        .map((q) =>
          prisma.surveyQuestion.update({
            where: { id: q.id },
            data: { ...q, surveyId },
          })
        );

      transaction.push(...questionCreates, ...questionUpdates);
    }

    return prisma.$transaction(transaction);
  }

  async publishSurvey(surveyId: string) {
    return prisma.survey.update({
      where: { id: surveyId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }
}