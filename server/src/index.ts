import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      logger.info('Server started', { port: env.port });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Failed to start server', { error: message });
    process.exit(1);
  }
};

startServer();
