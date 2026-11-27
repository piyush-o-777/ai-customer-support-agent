import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: (process.env.AI_BASE_URL || 'https://router.huggingface.co/v1').replace(/\/+$/, ''),
  aiModel: process.env.AI_MODEL || 'meta-llama/Llama-3.1-8B-Instruct',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  aiContextLimit: Number(process.env.AI_CONTEXT_LIMIT) || 12,
};
