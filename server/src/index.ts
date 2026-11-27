import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to start server:', message);
    process.exit(1);
  }
};

startServer();
