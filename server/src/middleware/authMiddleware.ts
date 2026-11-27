import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const payload = verifyToken(token);
    if (!payload.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
