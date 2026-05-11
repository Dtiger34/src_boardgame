import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthRequest extends Request {
  userId: string;
  username: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; username: string };
    (req as AuthRequest).userId = payload.sub;
    (req as AuthRequest).username = payload.username;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'INVALID_TOKEN' });
  }
}
