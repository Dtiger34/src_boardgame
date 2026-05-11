import { Router } from 'express';
import { db } from '../db';
import { AppError } from '../middleware/error-handler';
import type { GameCatalogEntry } from '@boardgame/types';

export const catalogRouter = Router();

function toEntry(row: Record<string, unknown>): GameCatalogEntry {
  return {
    gameType: row.game_type as string,
    name: row.name as string,
    description: row.description as string,
    rules: row.rules as string,
    minPlayers: row.min_players as number,
    maxPlayers: row.max_players as number,
    isActive: row.is_active as boolean,
  };
}

catalogRouter.get('/', async (_req, res) => {
  const result = await db.query(
    'SELECT * FROM game_catalog WHERE is_active = TRUE ORDER BY name',
  );
  res.json({ success: true, data: result.rows.map(toEntry) });
});

catalogRouter.get('/:gameType', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM game_catalog WHERE game_type = $1',
    [req.params.gameType],
  );
  if (result.rows.length === 0) throw new AppError('NOT_FOUND', 'Game not found', 404);
  res.json({ success: true, data: toEntry(result.rows[0]) });
});
