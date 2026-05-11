import { redis } from '../redis';

interface QueueEntry {
  userId: string;
  username: string;
  rating: number;
  joinedAt: number;
}

const RATING_RANGE = 200;
const EXPAND_MS = 30_000;

export const MatchmakingService = {
  async join(gameType: string, entry: Omit<QueueEntry, 'joinedAt'>): Promise<void> {
    const data: QueueEntry = { ...entry, joinedAt: Date.now() };
    await redis.zAdd(`queue:${gameType}`, { score: entry.rating, value: JSON.stringify(data) });
  },

  async leave(userId: string): Promise<void> {
    const keys = await redis.keys('queue:*');
    for (const key of keys) {
      const members = await redis.zRange(key, 0, -1);
      for (const m of members) {
        if ((JSON.parse(m) as QueueEntry).userId === userId) {
          await redis.zRem(key, m);
        }
      }
    }
  },

  async queueSize(gameType: string): Promise<number> {
    return redis.zCard(`queue:${gameType}`);
  },

  async findMatch(gameType: string): Promise<[QueueEntry, QueueEntry] | null> {
    const members = await redis.zRangeWithScores(`queue:${gameType}`, 0, -1);
    if (members.length < 2) return null;

    for (let i = 0; i < members.length - 1; i++) {
      const a = JSON.parse(members[i].value) as QueueEntry;
      const b = JSON.parse(members[i + 1].value) as QueueEntry;
      const wait = Math.min(Date.now() - a.joinedAt, Date.now() - b.joinedAt) / EXPAND_MS;
      if (Math.abs(a.rating - b.rating) <= RATING_RANGE * (1 + wait)) {
        await redis.zRem(`queue:${gameType}`, JSON.stringify(a));
        await redis.zRem(`queue:${gameType}`, JSON.stringify(b));
        return [a, b];
      }
    }
    return null;
  },
};
