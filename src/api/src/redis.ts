import { createClient } from 'redis';
import { logger } from './logger';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error('Redis error', err));
void redis.connect().catch((err) => {
  logger.warn('Redis unavailable at startup; continuing without Redis', err);
});
