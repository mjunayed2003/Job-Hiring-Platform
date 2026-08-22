import { io, Socket } from "socket.io-client";

type ConversationPayload = any;
type MessagePayload = any;
type UnreadCountPayload = { unreadCount: number };

type SendMessagePayload = {
  conversationId: string;
  content: string;
  attachmentUrl?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CHAT_NAMESPACE_URL = `${API_BASE_URL}/chat`;

class MessagesSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (typeof window === "undefined") {
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(CHAT_NAMESPACE_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }

  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", { conversationId });
  }

  sendMessage(payload: SendMessagePayload) {
    this.socket?.emit("send_message", payload);
  }

  deleteMessage(messageId: string) {
    this.socket?.emit("delete_message", { messageId });
  }

  deleteConversation(conversationId: string) {
    this.socket?.emit("delete_conversation", { conversationId });
  }

  onConversations(handler: (payload: ConversationPayload) => void) {
    this.socket?.on("conversations", handler);
    return () => this.socket?.off("conversations", handler);
  }

  onConversationMessages(handler: (payload: MessagePayload) => void) {
    this.socket?.on("conversation_messages", handler);
    return () => this.socket?.off("conversation_messages", handler);
  }

  onNewMessage(handler: (payload: MessagePayload) => void) {
    this.socket?.on("new_message", handler);
    return () => this.socket?.off("new_message", handler);
  }

  onMessageDeleted(handler: (payload: { messageId: string }) => void) {
    this.socket?.on("message_deleted", handler);
    return () => this.socket?.off("message_deleted", handler);
  }

  onConversationDeleted(handler: (payload: { conversationId: string }) => void) {
    this.socket?.on("conversation_deleted", handler);
    return () => this.socket?.off("conversation_deleted", handler);
  }

  onUnreadCount(handler: (payload: UnreadCountPayload) => void) {
    this.socket?.on("unread_count", handler);
    return () => this.socket?.off("unread_count", handler);
  }

  onConnect(handler: () => void) {
    this.socket?.on("connect", handler);
    return () => this.socket?.off("connect", handler);
  }

  onDisconnect(handler: () => void) {
    this.socket?.on("disconnect", handler);
    return () => this.socket?.off("disconnect", handler);
  }

  onError(handler: (error: unknown) => void) {
    this.socket?.on("connect_error", handler);
    return () => this.socket?.off("connect_error", handler);
  }

    getConversations() {
  this.socket?.emit("load_conversations", {});
}

onConversationsPage(handler: (payload: ConversationPayload) => void) {
  this.socket?.on("conversations_page", handler);
  return () => this.socket?.off("conversations_page", handler);
}
}

export const messagesSocket = new MessagesSocketService();
