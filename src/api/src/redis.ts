import { createClient } from 'redis';
import { logger } from './logger';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error('Redis error', err));
redis.connect();
