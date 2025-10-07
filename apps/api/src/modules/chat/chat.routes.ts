import { FastifyInstance } from 'fastify';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

export async function chatRoutes(fastify: FastifyInstance) {
  const chatService = new ChatService();
  const chatController = new ChatController(chatService);

  fastify.post(
    '/chat',
    chatController.startChat.bind(chatController)
  );

  fastify.post(
    '/chat/:chatId/messages',
    chatController.sendMessage.bind(chatController)
  );
}