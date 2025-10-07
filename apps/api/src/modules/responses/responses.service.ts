import { prisma } from '../../shared/database/prisma';
import { SubmitResponseInput, UpdateResponseInput } from '@critical-ai-surveys/schemas';
import appEmitter from '../../shared/events/emitter';

export class ResponseService {
  async submitResponse(data: SubmitResponseInput) {
    const response = await prisma.response.create({
      data: {
        questionId: data.questionId,
        sessionId: data.sessionId,
        value: data.value,
      },
    });

    // Emit an event after a new response is created
    appEmitter.emit('response.submitted', response);

    return response;
  }

  async getOpinionDistribution(questionId: string) {
    const results = await prisma.response.groupBy({
      by: ['value'],
      where: {
        questionId: questionId,
        // We only count the first response, not subsequent edits
        editedFromId: null,
      },
      _count: {
        value: true,
      },
    });

    // Transform the data into a simple key-value map
    const distribution = results.reduce((acc, curr) => {
      const likertValue = (curr.value as any)?.likert;
      if (likertValue) {
        acc[likertValue] = curr._count.value;
      }
      return acc;
    }, {} as Record<string, number>);

    return distribution;
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