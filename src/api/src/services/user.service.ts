import { db } from '../db';

export const UserService = {
  async getProfile(userId: string) {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.avatar_url, u.rating, u.created_at,
        COUNT(gp.game_id) AS games_played,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) AS games_won,
        COUNT(CASE WHEN g.is_draw = true THEN 1 END) AS games_draw,
        COUNT(CASE WHEN g.winner_id IS NOT NULL AND g.winner_id != u.id THEN 1 END) AS games_lost
       FROM users u
       LEFT JOIN game_players gp ON gp.user_id = u.id
       LEFT JOIN games g ON g.id = gp.game_id AND g.status = 'finished'
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async updateProfile(userId: string, data: { username?: string; avatarUrl?: string }) {
    if (data.username) {
      await db.query('UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2', [data.username, userId]);
    }
    if (data.avatarUrl) {
      await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [data.avatarUrl, userId]);
    }
  },

  async getGameHistory(userId: string, limit = 20) {
    const result = await db.query(
      `SELECT g.* FROM games g
       JOIN game_players gp ON gp.game_id = g.id
       WHERE gp.user_id = $1
       ORDER BY g.created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  async getLeaderboard() {
    const result = await db.query(
      'SELECT id, username, rating FROM users ORDER BY rating DESC LIMIT 50',
    );
    return result.rows;
  },

  async updateRating(userId: string, delta: number) {
    await db.query('UPDATE users SET rating = GREATEST(0, rating + $1) WHERE id = $2', [delta, userId]);
  },
};
