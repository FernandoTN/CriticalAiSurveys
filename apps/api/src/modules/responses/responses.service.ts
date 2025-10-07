import { prisma } from '../../shared/database/prisma';
import { SubmitResponseInput, UpdateResponseInput } from '@critical-ai-surveys/schemas';

export class ResponseService {
  async submitResponse(data: SubmitResponseInput) {
    return prisma.response.create({
      data: {
        questionId: data.questionId,
        sessionId: data.sessionId,
        value: data.value,
      },
    });
  }

  async updateResponse(responseId: string, data: UpdateResponseInput) {
    const originalResponse = await prisma.response.findUnique({ where: { id: responseId } });
    if (!originalResponse) {
      throw new Error("Original response not found");
    }

    // Create a new response that points to the original one
    return prisma.response.create({
      data: {
        questionId: originalResponse.questionId,
        sessionId: originalResponse.sessionId,
        value: data.value,
        editedFromId: originalResponse.id,
      },
    });
  }
}