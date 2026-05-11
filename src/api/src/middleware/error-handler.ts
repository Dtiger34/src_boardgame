import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: err.errors });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.code, message: err.message });
  }
  logger.error('Unhandled error', err);
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Internal server error' });
}
