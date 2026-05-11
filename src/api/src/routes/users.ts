import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { AppError } from '../middleware/error-handler';

export const usersRouter = Router();

usersRouter.get('/leaderboard', async (_req, res) => {
  res.json({ success: true, data: await UserService.getLeaderboard() });
});

usersRouter.get('/:userId', async (req, res) => {
  const user = await UserService.getProfile(req.params.userId);
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
  res.json({ success: true, data: user });
});

usersRouter.patch('/:userId', authMiddleware, async (req, res) => {
  const auth = req as AuthRequest;
  if (auth.userId !== req.params.userId) throw new AppError('FORBIDDEN', 'Forbidden', 403);
  await UserService.updateProfile(req.params.userId, req.body);
  res.json({ success: true });
});

usersRouter.get('/:userId/games', async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  res.json({ success: true, data: await UserService.getGameHistory(req.params.userId, limit) });
});
