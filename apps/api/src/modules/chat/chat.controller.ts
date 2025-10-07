import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from './chat.service';

export class ChatController {
  constructor(private chatService: ChatService) {}

  async startChat(request: FastifyRequest, reply: FastifyReply) {
    // In a real implementation, this would be validated.
    const { initialContext, sessionId } = request.body as { initialContext: string; sessionId: string };

    try {
      const chat = await this.chatService.startChat(sessionId, initialContext);
      reply.code(201).send(chat);
    } catch (error) {
      reply.code(500).send({ error: "Failed to start chat session" });
    }
  }

  async sendMessage(request: FastifyRequest<{ Params: { chatId: string } }>, reply: FastifyReply) {
    const { message } = request.body as { message: string };
    const { chatId } = request.params;

    try {
      const stream = await this.chatService.sendMessage(chatId, message);

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Cache-Control', 'no-cache');

      stream.pipe(reply.raw);

      request.raw.on('close', () => {
        stream.destroy();
      });

    } catch (error) {
      reply.code(500).send({ error: "Failed to send message" });
    }
  }
}