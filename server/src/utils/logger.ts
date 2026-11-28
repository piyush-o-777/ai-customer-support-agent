type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const formatLog = (level: LogLevel, message: string, meta?: Record<string, unknown>): string => {
  const timestamp = new Date().toISOString();
  const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${suffix}`;
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    console.log(formatLog('INFO', message, meta));
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    console.warn(formatLog('WARN', message, meta));
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    console.error(formatLog('ERROR', message, meta));
  },
};
