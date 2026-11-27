import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import { authRateLimiter } from './middleware/rateLimiter';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRateLimiter, authRoutes);
app.use('/chat', chatRoutes);

app.use((err: Error & { status?: number }, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  return next(err);
});

export default app;
