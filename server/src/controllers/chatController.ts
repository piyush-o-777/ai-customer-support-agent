import { Response } from 'express';
import * as chatService from '../services/chatService';
import { AuthenticatedRequest } from '../types/auth.types';
import { HttpError } from '../utils/httpError';
import { logger } from '../utils/logger';

const handleChatError = (res: Response, err: unknown): Response => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  logger.error('Unhandled chat error', {
    error: err instanceof Error ? err.message : 'Unknown error',
  });
  return res.status(500).json({ message: 'Internal server error' });
};

const writeSseEvent = (res: Response, event: string, data: unknown): void => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await chatService.createConversation(req.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return handleChatError(res, err);
  }
};

export const listConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await chatService.listConversations(req.userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleChatError(res, err);
  }
};

export const getMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await chatService.getMessages(req.params.id, req.userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleChatError(res, err);
  }
};

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await chatService.sendMessage(req.params.id, req.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return handleChatError(res, err);
  }
};

export const sendMessageStream = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  try {
    const result = await chatService.sendMessageStream(req.params.id, req.userId, req.body, {
      onUserMessage: (userMessage) => writeSseEvent(res, 'userMessage', { userMessage }),
      onChunk: (content) => writeSseEvent(res, 'chunk', { content }),
    });
    writeSseEvent(res, 'done', result);
    res.end();
  } catch (err) {
    const message = err instanceof HttpError ? err.message : 'Internal server error';
    writeSseEvent(res, 'error', { message });
    res.end();
  }
};

export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await chatService.deleteConversation(req.params.id, req.userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleChatError(res, err);
  }
};
