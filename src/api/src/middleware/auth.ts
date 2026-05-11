import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId: string;
  username: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string | undefined;
  const username = req.headers['x-username'] as string | undefined;
  if (!userId || !username) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
  }
  (req as AuthRequest).userId = userId;
  (req as AuthRequest).username = username;
  next();
}
