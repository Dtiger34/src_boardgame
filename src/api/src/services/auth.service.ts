import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { redis } from '../redis';
import { AppError } from '../middleware/error-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
const REFRESH_TTL = 60 * 60 * 24 * 7;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const AuthService = {
  async register(data: { username: string; email: string; password: string }): Promise<AuthTokens> {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [data.email, data.username],
    );
    if (existing.rows.length > 0) throw new AppError('CONFLICT', 'Email or username already taken', 409);

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 12);
    await db.query(
      'INSERT INTO users (id, username, email, password_hash, rating) VALUES ($1, $2, $3, $4, 1200)',
      [id, data.username, data.email, passwordHash],
    );
    return AuthService.generateTokens(id, data.username);
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const result = await db.query(
      'SELECT id, username, password_hash FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }
    return AuthService.generateTokens(user.id, user.username);
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; username: string };
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as typeof payload;
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
    }
    const stored = await redis.get(`refresh:${payload.sub}`);
    if (stored !== refreshToken) throw new AppError('UNAUTHORIZED', 'Refresh token revoked', 401);
    return AuthService.generateTokens(payload.sub, payload.username);
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string };
      await redis.del(`refresh:${payload.sub}`);
    } catch {
      // ignore
    }
  },

  async generateTokens(userId: string, username: string): Promise<AuthTokens> {
    const accessToken = jwt.sign({ sub: userId, username }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: userId, username }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await redis.set(`refresh:${userId}`, refreshToken, { EX: REFRESH_TTL });
    return { accessToken, refreshToken, expiresIn: 900 };
  },
};
