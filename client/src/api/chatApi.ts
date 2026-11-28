import { apiClient } from './client';
import { ChatMessage, Conversation, SendMessageResponse } from '../types/chat.types';
import { getToken } from '../utils/tokenStorage';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(
  /\/+$/,
  ''
);

export const listConversationsRequest = async (): Promise<{ conversations: Conversation[] }> => {
  const { data } = await apiClient.get<{ conversations: Conversation[] }>('/chat/conversations');
  return data;
};

export const createConversationRequest = async (
  title?: string
): Promise<{ conversation: Conversation }> => {
  const { data } = await apiClient.post<{ conversation: Conversation }>(
    '/chat/conversations',
    title ? { title } : {}
  );
  return data;
};

export const getMessagesRequest = async (
  conversationId: string
): Promise<{ messages: ChatMessage[] }> => {
  const { data } = await apiClient.get<{ messages: ChatMessage[] }>(
    `/chat/conversations/${conversationId}/messages`
  );
  return data;
};

export const sendMessageRequest = async (
  conversationId: string,
  content: string
): Promise<SendMessageResponse> => {
  const { data } = await apiClient.post<SendMessageResponse>(
    `/chat/conversations/${conversationId}/messages`,
    { content }
  );
  return data;
};

export const streamMessageRequest = async (
  conversationId: string,
  content: string,
  handlers: {
    onUserMessage?: (userMessage: ChatMessage) => void;
    onChunk: (chunk: string) => void;
  }
): Promise<SendMessageResponse> => {
  const token = getToken();
  const response = await fetch(`${apiBaseUrl}/chat/conversations/${conversationId}/messages/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    let message = 'Failed to send message';
    try {
      const errData = (await response.json()) as { message?: string };
      if (errData.message) {
        message = errData.message;
      }
    } catch {
      message = 'Failed to send message';
    }
    throw new Error(message);
  }
  if (!response.body) {
    throw new Error('Streaming response unavailable');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: SendMessageResponse | null = null;

  const processBlock = (block: string) => {
    const lines = block.split(/\r?\n/);
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length === 0) {
      return;
    }
    const parsed = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
    if (eventName === 'userMessage' && parsed.userMessage) {
      handlers.onUserMessage?.(parsed.userMessage as ChatMessage);
    } else if (eventName === 'chunk' && typeof parsed.content === 'string') {
      handlers.onChunk(parsed.content);
    } else if (eventName === 'done') {
      finalResult = parsed as unknown as SendMessageResponse;
    } else if (eventName === 'error') {
      throw new Error(
        typeof parsed.message === 'string' ? parsed.message : 'Failed to generate response'
      );
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    for (const block of blocks) {
      if (block.trim()) {
        processBlock(block);
      }
    }
  }
  if (buffer.trim()) {
    processBlock(buffer);
  }
  if (!finalResult) {
    throw new Error('Stream ended unexpectedly');
  }
  return finalResult;
};

export const deleteConversationRequest = async (
  conversationId: string
): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(
    `/chat/conversations/${conversationId}`
  );
  return data;
};
