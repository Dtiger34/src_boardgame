import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { GameService } from '../services/game.service';

export const gamesRouter = Router();
gamesRouter.use(authMiddleware);

gamesRouter.get('/rooms', async (_req, res) => {
  res.json({ success: true, data: await GameService.listPublicRooms() });
});

gamesRouter.post('/rooms', async (req, res) => {
  const auth = req as unknown as AuthRequest;
  const room = await GameService.createRoom({
    gameType: req.body.gameType,
    isPrivate: req.body.isPrivate ?? false,
    timeControlMs: req.body.timeControlMs,
    createdBy: auth.userId,
    username: auth.username,
  });
  res.status(201).json({ success: true, data: room });
});

gamesRouter.post('/rooms/join-by-code', async (req, res) => {
  const auth = req as unknown as AuthRequest;
  const room = await GameService.joinRoomByCode(req.body.inviteCode, auth.userId, auth.username);
  res.json({ success: true, data: room });
});

gamesRouter.get('/rooms/:roomId', async (req, res) => {
  res.json({ success: true, data: await GameService.getRoom(req.params.roomId) });
});

gamesRouter.post('/rooms/:roomId/join', async (req, res) => {
  const auth = req as unknown as AuthRequest;
  const room = await GameService.joinRoom(req.params.roomId, auth.userId, auth.username);
  res.json({ success: true, data: room });
});

gamesRouter.get('/:roomId', async (req, res) => {
  const game = await GameService.getGame(req.params.roomId);
  res.json({ success: true, data: game });
});
