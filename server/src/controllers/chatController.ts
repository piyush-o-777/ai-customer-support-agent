import { Response } from 'express';
import * as chatService from '../services/chatService';
import { AuthenticatedRequest } from '../types/auth.types';
import { HttpError } from '../utils/httpError';

const handleChatError = (res: Response, err: unknown): Response => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Internal server error' });
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
