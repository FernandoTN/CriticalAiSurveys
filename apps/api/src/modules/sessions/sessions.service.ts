import { prisma } from '../../shared/database/prisma';
import { CreateSessionInput } from '@critical-ai-surveys/schemas';
import { customAlphabet } from 'nanoid';

// Generates an 8-character alphanumeric key (uppercase)
const generateSessionKey = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export class SessionService {
  async createAnonymousSession(data: CreateSessionInput) {
    const sessionKey = generateSessionKey();

    return prisma.session.create({
      data: {
        surveyId: data.surveyId,
        locale: data.locale,
        sessionKey,
      },
    });
  }

  async getSessionById(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
    });
  }
}