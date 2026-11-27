import mongoose from 'mongoose';
import { env } from '../config/env';
import { Conversation, IConversation } from '../models/Conversation';
import { IMessage, Message } from '../models/Message';
import {
  AIMessage,
  CreateConversationInput,
  PublicConversation,
  PublicMessage,
  SendMessageInput,
  SendMessageResponse,
} from '../types/chat.types';
import { HttpError } from '../utils/httpError';
import { generateReply } from './aiService';

const DEFAULT_TITLE = 'New Conversation';
const MAX_TITLE_LENGTH = 60;

const formatConversation = (conversation: IConversation): PublicConversation => ({
  id: conversation._id.toString(),
  title: conversation.title,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

const formatMessage = (message: IMessage): PublicMessage => ({
  id: message._id.toString(),
  conversationId: message.conversationId.toString(),
  role: message.role,
  content: message.content,
  createdAt: message.createdAt,
});

const findOwnedConversation = async (
  conversationId: string,
  userId: string
): Promise<IConversation> => {
  if (!mongoose.isValidObjectId(conversationId)) {
    throw new HttpError(404, 'Conversation not found');
  }
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new HttpError(404, 'Conversation not found');
  }
  return conversation;
};

const buildAutoTitle = (content: string): string => {
  const clean = content.replace(/\s+/g, ' ').trim();
  return clean.length > MAX_TITLE_LENGTH ? `${clean.slice(0, MAX_TITLE_LENGTH)}...` : clean;
};

export const createConversation = async (
  userId: string,
  input: CreateConversationInput = {}
): Promise<{ conversation: PublicConversation }> => {
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  const title = rawTitle ? rawTitle.slice(0, MAX_TITLE_LENGTH) : DEFAULT_TITLE;
  const conversation = await Conversation.create({ userId, title });
  return {
    conversation: formatConversation(conversation),
  };
};

export const listConversations = async (
  userId: string
): Promise<{ conversations: PublicConversation[] }> => {
  const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 });
  return {
    conversations: conversations.map(formatConversation),
  };
};

export const getMessages = async (
  conversationId: string,
  userId: string
): Promise<{ messages: PublicMessage[] }> => {
  await findOwnedConversation(conversationId, userId);
  const messages = await Message.find({ conversationId, userId }).sort({ createdAt: 1 });
  return {
    messages: messages.map(formatMessage),
  };
};

export const sendMessage = async (
  conversationId: string,
  userId: string,
  input: SendMessageInput = {}
): Promise<SendMessageResponse> => {
  if (typeof input.content !== 'string' || !input.content.trim()) {
    throw new HttpError(400, 'Message content is required');
  }
  const content = input.content.trim();
  const conversation = await findOwnedConversation(conversationId, userId);
  const userMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: 'user',
    content,
  });
  if (conversation.title === DEFAULT_TITLE) {
    conversation.title = buildAutoTitle(content);
  }
  conversation.updatedAt = new Date();
  await conversation.save();
  const recentMessages = await Message.find({ conversationId: conversation._id, userId })
    .sort({ createdAt: -1 })
    .limit(env.aiContextLimit);
  const history: AIMessage[] = recentMessages
    .reverse()
    .map((msg) => ({ role: msg.role, content: msg.content }));
  const replyText = await generateReply(history);
  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: 'assistant',
    content: replyText,
  });
  conversation.updatedAt = new Date();
  await conversation.save();
  return {
    userMessage: formatMessage(userMessage),
    assistantMessage: formatMessage(assistantMessage),
  };
};

export const deleteConversation = async (
  conversationId: string,
  userId: string
): Promise<{ message: string }> => {
  const conversation = await findOwnedConversation(conversationId, userId);
  await Message.deleteMany({ conversationId: conversation._id, userId });
  await Conversation.deleteOne({ _id: conversation._id, userId });
  return { message: 'Conversation deleted' };
};
