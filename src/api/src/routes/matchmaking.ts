import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { MatchmakingService } from '../services/matchmaking.service';
import { db } from '../db';

export const matchmakingRouter = Router();
matchmakingRouter.use(authMiddleware);

matchmakingRouter.post('/join', async (req, res) => {
  const auth = req as AuthRequest;
  const { gameType } = req.body;
  const result = await db.query('SELECT rating FROM users WHERE id = $1', [auth.userId]);
  const rating = result.rows[0]?.rating ?? 1200;
  await MatchmakingService.join(gameType, { userId: auth.userId, username: auth.username, rating });
  res.json({ success: true, message: 'Joined queue' });
});

matchmakingRouter.delete('/leave', async (req, res) => {
  const auth = req as AuthRequest;
  await MatchmakingService.leave(auth.userId);
  res.json({ success: true });
});

matchmakingRouter.get('/queue/:gameType', async (req, res) => {
  const size = await MatchmakingService.queueSize(req.params.gameType);
  res.json({ success: true, data: { size } });
});
