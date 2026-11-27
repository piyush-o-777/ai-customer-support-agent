export type MessageRole = 'user' | 'assistant';

export interface PublicConversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface CreateConversationInput {
  title?: unknown;
}

export interface SendMessageInput {
  content?: unknown;
}

export interface AIMessage {
  role: 'system' | MessageRole;
  content: string;
}

export interface SendMessageResponse {
  userMessage: PublicMessage;
  assistantMessage: PublicMessage;
}
