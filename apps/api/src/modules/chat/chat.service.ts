import { prisma } from '../../shared/database/prisma';
import { PassThrough } from 'stream';

// A mock provider to simulate AI responses
class MockAiProvider {
  async streamResponse(message: string): Promise<PassThrough> {
    const stream = new PassThrough();
    const chunks = [
      "That's ", "an ", "interesting ", "point. ", "Have ", "you ",
      "considered ", "the ", "economic ", "implications ", "of ",
      "that ", "perspective? ", "For ", "example, ", "how ",
      "might ", "it ", "affect ", "jobs ", "in ", "traditional ", "industries?"
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < chunks.length) {
        stream.write(`data: ${JSON.stringify({ delta: chunks[i] })}\n\n`);
        i++;
      } else {
        clearInterval(interval);
        stream.write(`event: message_complete\ndata: {"reason": "stop"}\n\n`);
        stream.end();
      }
    }, 50);

    return stream;
  }
}

export class ChatService {
  private aiProvider: MockAiProvider;

  constructor() {
    this.aiProvider = new MockAiProvider();
  }

  async startChat(sessionId: string, initialContext: string) {
    // In a real implementation, you might get an initial message from the AI.
    // For now, we'll just create the chat record.
    return prisma.aiChat.create({
      data: {
        sessionId,
        persona: 'socratic', // Hardcoded for now
        turnIndex: 0,
        userMessage: initialContext,
        aiResponse: "Let's begin our conversation. What's on your mind?",
      },
    });
  }

  async sendMessage(chatId: string, message: string) {
    // A real implementation would save the user message and the AI response.
    // For now, we just get the stream.
    return this.aiProvider.streamResponse(message);
  }
}