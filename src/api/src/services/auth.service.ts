import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { redis } from '../redis';
import { AppError } from '../middleware/error-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
const REFRESH_TTL = 60 * 60 * 24 * 7;

export type AuthUser = { id: string; username: string; displayName: string | null; rating: number };
export type AuthTokens = { accessToken: string; refreshToken: string };

export const AuthService = {
  async register(data: { username: string; password: string }): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const existing = await db.query('SELECT id FROM users WHERE username = $1', [data.username]);
    if (existing.rows.length > 0) throw new AppError('CONFLICT', 'Username already taken', 409);

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 12);
    await db.query(
      'INSERT INTO users (id, username, password_hash, rating) VALUES ($1, $2, $3, 1200)',
      [id, data.username, passwordHash],
    );
    const tokens = await AuthService.generateTokens(id, data.username);
    return { tokens, user: { id, username: data.username, displayName: null, rating: 1200 } };
  },

  async login(username: string, password: string): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const result = await db.query(
      'SELECT id, username, display_name, password_hash, rating FROM users WHERE username = $1',
      [username],
    );
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }
    const tokens = await AuthService.generateTokens(row.id, row.username);
    return { tokens, user: { id: row.id, username: row.username, displayName: row.display_name ?? null, rating: row.rating } };
  },

  async refresh(refreshToken: string): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    let payload: { sub: string; username: string };
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as typeof payload;
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
    }
    const stored = await redis.get(`refresh:${payload.sub}`);
    if (stored !== refreshToken) throw new AppError('UNAUTHORIZED', 'Refresh token revoked', 401);

    const result = await db.query('SELECT rating, display_name FROM users WHERE id = $1', [payload.sub]);
    const { rating = 1200, display_name } = result.rows[0] ?? {};
    const tokens = await AuthService.generateTokens(payload.sub, payload.username);
    return { tokens, user: { id: payload.sub, username: payload.username, displayName: display_name ?? null, rating } };
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string };
      await redis.del(`refresh:${payload.sub}`);
    } catch {
      // ignore
    }
  },

  async guestLogin(displayName: string): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    const trimmed = displayName.trim().slice(0, 30);
    if (!trimmed) throw new AppError('VALIDATION', 'Display name is required', 400);

    // Try to reuse existing guest account with this display name
    const existing = await db.query(
      'SELECT id, username, display_name, rating FROM users WHERE username = $1',
      [trimmed],
    );
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const tokens = await AuthService.generateTokens(row.id, row.username);
      return { tokens, user: { id: row.id, username: row.username, displayName: row.display_name ?? null, rating: row.rating } };
    }

    const id = uuidv4();
    await db.query(
      'INSERT INTO users (id, username, password_hash, rating) VALUES ($1, $2, $3, 1200)',
      [id, trimmed, ''],
    );
    const tokens = await AuthService.generateTokens(id, trimmed);
    return { tokens, user: { id, username: trimmed, displayName: trimmed, rating: 1200 } };
  },

  async generateTokens(userId: string, username: string): Promise<AuthTokens> {
    const accessToken = jwt.sign({ sub: userId, username }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ sub: userId, username }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await redis.set(`refresh:${userId}`, refreshToken, { EX: REFRESH_TTL });
    return { accessToken, refreshToken };
  },
};
