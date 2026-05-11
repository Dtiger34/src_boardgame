import { v4 as uuidv4 } from 'uuid';
import { GameState, GameRoom, GameResult } from '@boardgame/types';
import { db } from '../db';
import { redis } from '../redis';
import { EngineRegistry } from '../engines/registry';
import { AppError } from '../middleware/error-handler';

const TTL = 60 * 60 * 24;

export const GameService = {
  async createRoom(opts: {
    gameType: string;
    isPrivate: boolean;
    timeControlMs?: number;
    createdBy: string;
    username: string;
  }): Promise<GameRoom> {
    const room: GameRoom = {
      id: uuidv4(),
      gameType: opts.gameType,
      isPrivate: opts.isPrivate,
      inviteCode: opts.isPrivate ? uuidv4().split('-')[0].toUpperCase() : undefined,
      maxPlayers: 2,
      timeControlMs: opts.timeControlMs,
      createdBy: opts.createdBy,
      players: [{
        userId: opts.createdBy,
        username: opts.username,
        color: 'black',
        timeLeftMs: opts.timeControlMs ?? 0,
        isConnected: true,
      }],
      status: 'waiting',
    };
    await redis.set(`room:${room.id}`, JSON.stringify(room), { EX: TTL });
    return room;
  },

  async getRoom(roomId: string): Promise<GameRoom> {
    const raw = await redis.get(`room:${roomId}`);
    if (!raw) throw new AppError('NOT_FOUND', 'Room not found', 404);
    return JSON.parse(raw);
  },

  async joinRoom(roomId: string, userId: string, username: string): Promise<GameRoom> {
    const room = await GameService.getRoom(roomId);
    if (room.status !== 'waiting') throw new AppError('ROOM_NOT_OPEN', 'Room is not open', 400);
    if (room.players.find((p) => p.userId === userId)) return room;
    if (room.players.length >= room.maxPlayers) throw new AppError('ROOM_FULL', 'Room is full', 400);

    room.players.push({
      userId,
      username,
      color: 'white',
      timeLeftMs: room.timeControlMs ?? 0,
      isConnected: true,
    });
    await redis.set(`room:${roomId}`, JSON.stringify(room), { EX: TTL });
    return room;
  },

  async startGame(roomId: string): Promise<GameState> {
    const room = await GameService.getRoom(roomId);
    if (room.players.length < 2) throw new AppError('NOT_ENOUGH_PLAYERS', 'Need 2 players', 400);

    const engine = EngineRegistry.get(room.gameType);
    const game: GameState = {
      id: uuidv4(),
      gameType: room.gameType,
      status: 'in_progress',
      players: room.players,
      boardState: engine.getInitialState(),
      moves: [],
      currentTurn: room.players[0].userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeControlMs: room.timeControlMs,
    };

    await redis.set(`game:${room.id}`, JSON.stringify(game), { EX: TTL });
    await db.query(
      'INSERT INTO games (id, game_type, room_id, status) VALUES ($1, $2, $3, $4)',
      [game.id, game.gameType, roomId, 'in_progress'],
    );
    await db.query(
      'INSERT INTO game_players (game_id, user_id, color) VALUES ($1, $2, $3), ($1, $4, $5)',
      [game.id, room.players[0].userId, 'black', room.players[1].userId, 'white'],
    );
    return game;
  },

  async getGame(roomId: string): Promise<GameState | null> {
    const raw = await redis.get(`game:${roomId}`);
    return raw ? JSON.parse(raw) : null;
  },

  async applyMove(
    roomId: string,
    playerId: string,
    moveData: Record<string, unknown>,
  ): Promise<{ game: GameState; result: GameResult | null }> {
    const game = await GameService.getGame(roomId);
    if (!game) throw new AppError('NOT_FOUND', 'Game not found', 404);
    if (game.status !== 'in_progress') throw new AppError('GAME_OVER', 'Game is not active', 400);
    if (game.currentTurn !== playerId) throw new AppError('NOT_YOUR_TURN', 'Not your turn', 400);

    const engine = EngineRegistry.get(game.gameType);
    const { newBoardState, isValid } = engine.validateAndApply(game.boardState, moveData, playerId);
    if (!isValid) throw new AppError('INVALID_MOVE', 'Invalid move', 400);

    const nextPlayer = game.players.find((p) => p.userId !== playerId)!;
    game.moves.push({ playerId, moveData, timestamp: Date.now(), moveIndex: game.moves.length });
    game.boardState = newBoardState;
    game.currentTurn = nextPlayer.userId;
    game.updatedAt = Date.now();

    let result: GameResult | null = null;
    const engineResult = engine.checkResult(newBoardState, game.players);
    if (engineResult) {
      game.status = 'finished';
      game.winner = engineResult.winner;
      result = {
        gameId: game.id,
        winner: engineResult.winner,
        isDraw: engineResult.isDraw,
        reason: engineResult.reason,
        ratingChanges: GameService.calcRatingChanges(game.players, engineResult.winner),
      };
      await db.query(
        'UPDATE games SET status = $1, winner_id = $2, is_draw = $3, finished_at = NOW() WHERE id = $4',
        ['finished', result.winner ?? null, result.isDraw, game.id],
      );
    }

    await redis.set(`game:${roomId}`, JSON.stringify(game), { EX: TTL });
    return { game, result };
  },

  async resign(roomId: string, playerId: string): Promise<GameResult> {
    const game = await GameService.getGame(roomId);
    if (!game) throw new AppError('NOT_FOUND', 'Game not found', 404);

    const winner = game.players.find((p) => p.userId !== playerId)!;
    game.status = 'finished';
    game.winner = winner.userId;

    const result: GameResult = {
      gameId: game.id,
      winner: winner.userId,
      isDraw: false,
      reason: 'resignation',
      ratingChanges: GameService.calcRatingChanges(game.players, winner.userId),
    };

    await redis.set(`game:${roomId}`, JSON.stringify(game), { EX: TTL });
    await db.query('UPDATE games SET status = $1, winner_id = $2, finished_at = NOW() WHERE id = $3', [
      'finished', winner.userId, game.id,
    ]);
    return result;
  },

  calcRatingChanges(players: GameState['players'], winnerId?: string): Record<string, number> {
    if (!winnerId) return { [players[0].userId]: 0, [players[1].userId]: 0 };
    const loser = players.find((p) => p.userId !== winnerId)!;
    return { [winnerId]: 15, [loser.userId]: -15 };
  },
};
