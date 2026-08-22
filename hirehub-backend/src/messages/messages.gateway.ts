import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>(); // userId → socketId
  private connectedSince = new Map<string, Date>();

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  // ==================================================
  // CONNECTION — connect  conversations load 
  // ==================================================
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.userId = payload.sub;
      this.connectedUsers.set(payload.sub, client.id);
      this.connectedSince.set(payload.sub, new Date());
      await this.messagesService.markUserOnline(payload.sub);

      //  Connect  conversations load
      const conversations = await this.messagesService.getConversations(payload.sub);
      client.emit('conversations', conversations);

      //  Unread count
      const unreadCount = await this.messagesService.getUnreadCount(payload.sub);
      client.emit('unread_count', unreadCount);

      console.log(` User connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.connectedSince.delete(userId);
      void this.messagesService.markUserOffline(userId);
      console.log(`❌ User disconnected: ${userId}`);
    }
  }

  // ==================================================
  // JOIN CONVERSATION — messages load হবে
  // ==================================================
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.conversationId);

    //  messages load 
    const messages = await this.messagesService.getMessages(
      data.conversationId,
      client.data.userId,
    );
    client.emit('conversation_messages', messages);

    //  Read unread count update
    const unreadCount = await this.messagesService.getUnreadCount(client.data.userId);
    client.emit('unread_count', unreadCount);
  }

  @SubscribeMessage('load_conversations')
  async handleLoadConversations(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.messagesService.getConversationsPaginated(
      client.data.userId,
      {
        page: data?.page,
        limit: data?.limit,
      },
    );

    client.emit('conversations_page', result);
  }

  // ==================================================
  // SEND MESSAGE — real-time
  // ==================================================
  @SubscribeMessage('send_message')
async handleSendMessage(
  @MessageBody() data: { conversationId: string; content: string; attachmentUrl?: string },
  @ConnectedSocket() client: Socket,
) {
  // ✅ Block check
  const participants = await this.messagesService.getConversationParticipants(data.conversationId);
  const userIds = participants.map((p) => p.userId);
  const users = await this.messagesService.getUsersByIds(userIds);
  const hasBlockedUser = users.some((u) => u.status === 'BLOCKED');

  if (hasBlockedUser) {
    client.emit('error', { message: 'This conversation has been blocked by admin.' });
    return;
  }

  const message = await this.messagesService.sendMessage(
    data.conversationId,
    client.data.userId,
    data.content,
    data.attachmentUrl,
  );

  this.server.to(data.conversationId).emit('new_message', message);

  for (const participant of participants) {
    const socketId = this.connectedUsers.get(participant.userId);
    if (socketId) {
      const conversations = await this.messagesService.getConversations(participant.userId);
      this.server.to(socketId).emit('conversations', conversations);

      const unreadCount = await this.messagesService.getUnreadCount(participant.userId);
      this.server.to(socketId).emit('unread_count', unreadCount);
    }
  }
}

  // ==================================================
  // DELETE MESSAGE — real-time
  // ==================================================
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.deleteMessage(
      data.messageId,
      client.data.userId,
    );

    //  Conversation room  message_deleted
    this.server.to(message.conversationId).emit('message_deleted', {
      messageId: data.messageId,
    });
  }

  // ==================================================
  // DELETE CONVERSATION — real-time
  // ==================================================
  @SubscribeMessage('delete_conversation')
  async handleDeleteConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.messagesService.deleteConversation(
      data.conversationId,
      client.data.userId,
    );

    for (const participantUserId of result.participantUserIds) {
      const socketId = this.connectedUsers.get(participantUserId);
      if (socketId) {
        const conversations = await this.messagesService.getConversations(participantUserId);
        const unreadCount = await this.messagesService.getUnreadCount(participantUserId);

        this.server.to(socketId).emit('conversations', conversations);
        this.server.to(socketId).emit('unread_count', unreadCount);
      }
    }

    client.emit('conversation_deleted', {
      conversationId: data.conversationId,
    });
  }

  
}