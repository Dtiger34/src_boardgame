import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  res.json({ success: true, data: { user: { id: auth.userId, username: auth.username } } });
});
