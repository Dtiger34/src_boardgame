import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { AppError } from '../middleware/error-handler';

export const authRouter = Router();

const RegisterSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/register', async (req, res) => {
  const body = RegisterSchema.parse(req.body);
  const tokens = await AuthService.register(body);
  res.status(201).json({ success: true, data: tokens });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body);
  const tokens = await AuthService.login(email, password);
  res.json({ success: true, data: tokens });
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('MISSING_TOKEN', 'Refresh token required');
  res.json({ success: true, data: await AuthService.refresh(refreshToken) });
});

authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await AuthService.logout(refreshToken);
  res.json({ success: true });
});
