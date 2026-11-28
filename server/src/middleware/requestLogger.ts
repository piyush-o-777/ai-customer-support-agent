import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
    };
    if (res.statusCode >= 500) {
      logger.error('HTTP request failed', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request warning', meta);
    } else {
      logger.info('HTTP request completed', meta);
    }
  });
  next();
};
