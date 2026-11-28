import { Response } from 'express';
import * as authService from '../services/authService';
import { AuthenticatedRequest } from '../types/auth.types';
import { HttpError } from '../utils/httpError';
import { logger } from '../utils/logger';

const handleAuthError = (res: Response, err: unknown): Response => {
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ message: 'Email is already registered' });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  logger.error('Unhandled auth error', {
    error: err instanceof Error ? err.message : 'Unknown error',
  });
  return res.status(500).json({ message: 'Internal server error' });
};

export const signup = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const result = await authService.signup(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await authService.getCurrentUser(req.userId);
    return res.status(200).json(result);
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const logout = (_req: AuthenticatedRequest, res: Response): Response => {
  return res.status(200).json({ message: 'Logged out successfully' });
};
