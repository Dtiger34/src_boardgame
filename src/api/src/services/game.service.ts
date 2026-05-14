import { v4 as uuidv4 } from 'uuid';
import type { GameState, GameRoom, GameResult, WerewolfPrivateInfo } from '@boardgame/types';
import { db } from '../db';
import { redis } from '../redis';
import { EngineRegistry } from '../engines/registry';
import { AppError } from '../middleware/error-handler';
import {
  initWerewolfGame,
  getPublicState,
  getPrivateInfo,
  resolveNight,
  resolveVote,
  WerewolfState,
  PHASE_DURATION,
} from '../engines/werewolf';

const TTL = 60 * 60 * 24;

export const GameService = {
  async createRoom(opts: {
    gameType: string;
    isPrivate: boolean;
    timeControlMs?: number;
    createdBy: string;
    username: string;
  }): Promise<GameRoom> {
    // Validate game type early so invalid rooms are never created.
    EngineRegistry.get(opts.gameType);

    const inviteCode = uuidv4().split('-')[0].toUpperCase();
    const maxPlayers = opts.gameType === 'werewolf' ? 18 : 2;
    const room: GameRoom = {
      id: uuidv4(),
      gameType: opts.gameType,
      isPrivate: opts.isPrivate,
      inviteCode,
      maxPlayers,
      timeControlMs: opts.timeControlMs,
      createdBy: opts.createdBy,
      players: [
        {
          userId: opts.createdBy,
          username: opts.username,
          color: 'black',
          timeLeftMs: opts.timeControlMs ?? 0,
          isConnected: true,
        },
      ],
      status: 'waiting',
    };
    await redis.set(`room:${room.id}`, JSON.stringify(room), { EX: TTL });
    await redis.set(`inviteCode:${inviteCode}`, room.id, { EX: TTL });
    if (!opts.isPrivate) {
      await redis.sAdd('rooms:public', room.id);
    }
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
    if (room.players.length >= room.maxPlayers)
      throw new AppError('ROOM_FULL', 'Room is full', 400);

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

  async joinRoomByCode(inviteCode: string, userId: string, username: string): Promise<GameRoom> {
    const roomId = await redis.get(`inviteCode:${inviteCode.toUpperCase()}`);
    if (!roomId) throw new AppError('INVALID_CODE', 'Invalid invite code', 404);
    return GameService.joinRoom(roomId, userId, username);
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const raw = await redis.get(`room:${roomId}`);
    if (!raw) return;

    const room = JSON.parse(raw) as GameRoom;
    room.players = room.players.filter((p) => p.userId !== userId);

    if (room.players.length === 0) {
      await GameService.clearRoom(room);
    } else {
      await redis.set(`room:${roomId}`, JSON.stringify(room), { EX: TTL });
    }
  },

  async clearRoom(room: GameRoom): Promise<void> {
    await redis.del(`room:${room.id}`);
    if (room.inviteCode) await redis.del(`inviteCode:${room.inviteCode}`);
    if (!room.isPrivate) await redis.sRem('rooms:public', room.id);
  },

  async setPlayerReady(roomId: string, userId: string): Promise<GameRoom> {
    const room = await GameService.getRoom(roomId);
    const player = room.players.find((p) => p.userId === userId);
    if (!player) throw new AppError('NOT_IN_ROOM', 'You are not in this room', 400);
    player.isReady = true;
    await redis.set(`room:${roomId}`, JSON.stringify(room), { EX: TTL });
    return room;
  },

  async resetReadyStates(roomId: string): Promise<GameRoom | null> {
    const raw = await redis.get(`room:${roomId}`);
    if (!raw) return null;
    const room = JSON.parse(raw) as GameRoom;
    for (const p of room.players) p.isReady = false;
    await redis.set(`room:${roomId}`, JSON.stringify(room), { EX: TTL });
    return room;
  },

  async setCustomRoles(
    roomId: string,
    userId: string,
    roles: Record<string, number>,
  ): Promise<GameRoom> {
    const room = await GameService.getRoom(roomId);
    if (room.createdBy !== userId) throw new AppError('FORBIDDEN', 'Only host can set roles', 403);
    if (room.status !== 'waiting') throw new AppError('ROOM_NOT_OPEN', 'Room is not open', 400);
    const total = Object.values(roles).reduce((s, n) => s + n, 0);
    if (total > room.maxPlayers)
      throw new AppError('TOO_MANY_ROLES', 'Role count exceeds max players', 400);
    room.customRoles = total === 0 ? undefined : roles;
    await redis.set(`room:${roomId}`, JSON.stringify(room), { EX: TTL });
    return room;
  },

  async listPublicRooms(): Promise<GameRoom[]> {
    const ids = await redis.sMembers('rooms:public');
    if (ids.length === 0) return [];
    const raws = await Promise.all(ids.map((id) => redis.get(`room:${id}`)));
    const staleIds: string[] = [];
    const rooms: GameRoom[] = [];

    for (let i = 0; i < ids.length; i += 1) {
      const raw = raws[i];
      if (!raw) {
        staleIds.push(ids[i]);
        continue;
      }
      const room = JSON.parse(raw) as GameRoom;
      if (room.isPrivate || room.status !== 'waiting') {
        staleIds.push(ids[i]);
        continue;
      }
      rooms.push(room);
    }

    if (staleIds.length > 0) {
      await redis.sRem('rooms:public', staleIds);
    }

    return rooms;
  },

  async startGame(roomId: string): Promise<GameState> {
    const room = await GameService.getRoom(roomId);
    const minPlayers = room.gameType === 'werewolf' ? 4 : 2;
    if (room.players.length < minPlayers) {
      throw new AppError('NOT_ENOUGH_PLAYERS', `Need at least ${minPlayers} players`, 400);
    }

    const engine = EngineRegistry.get(room.gameType);
    const game: GameState = {
      id: uuidv4(),
      gameType: room.gameType,
      status: 'in_progress',
      players: room.players,
      boardState:
        room.gameType === 'werewolf' ? {} : engine.getInitialState(),
      moves: [],
      currentTurn: room.players[0].userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeControlMs: room.timeControlMs,
      createdBy: room.createdBy,
    };

    if (room.gameType === 'werewolf') {
      const playerIds = room.players.map((p) => p.userId);

      if (room.customRoles) {
        const total = Object.values(room.customRoles).reduce((s, n) => s + n, 0);
        if (total !== playerIds.length) {
          throw new AppError(
            'ROLE_COUNT_MISMATCH',
            `Custom roles total (${total}) must equal player count (${playerIds.length})`,
            400,
          );
        }
      }
      game.boardState = initWerewolfGame(playerIds, room.customRoles);
    }

    room.status = 'in_progress';
    if (!room.isPrivate) await redis.sRem('rooms:public', roomId);
    await redis.set(`room:${roomId}`, JSON.stringify(room), { EX: TTL });
    await redis.set(`game:${roomId}`, JSON.stringify(game), { EX: TTL });

    // DB logging is best-effort — game runs entirely on Redis
    db.query('INSERT INTO games (id, game_type, room_id, status) VALUES ($1, $2, $3, $4)', [
      game.id,
      game.gameType,
      roomId,
      'in_progress',
    ]).catch(() => {});

    return game;
  },

  async getGame(roomId: string): Promise<GameState | null> {
    const raw = await redis.get(`game:${roomId}`);
    return raw ? JSON.parse(raw) : null;
  },

  scrubGameState(game: GameState): GameState {
    if (game.gameType !== 'werewolf') return game;
    return {
      ...game,
      boardState: getPublicState(game.boardState as WerewolfState),
    };
  },

  getWerewolfPrivateInfo(game: GameState, userId: string): WerewolfPrivateInfo | null {
    if (game.gameType !== 'werewolf') return null;
    return getPrivateInfo(game.boardState as WerewolfState, userId);
  },

  async advancePhase(roomId: string): Promise<GameState | null> {
    const game = await GameService.getGame(roomId);
    if (!game || game.gameType !== 'werewolf') return null;

    const state = game.boardState as WerewolfState;
    let newState: WerewolfState;

    if (state.phase === 'night') {
      newState = resolveNight(state);
    } else if (state.phase === 'day_discussion') {
      newState = {
        ...(structuredClone(state) as WerewolfState),
        phase: 'day_vote',
        phaseEndsAt: Date.now() + PHASE_DURATION.day_vote,
      };
    } else if (state.phase === 'day_vote') {
      const resolved = resolveVote(state);
      // Stuttering judge second vote: if signaled and first vote not yet done, trigger second round
      if (state.stutteringJudgeSignaledThisDay && !state.secondVoteTriggered) {
        newState = {
          ...(structuredClone(resolved) as WerewolfState),
          secondVoteTriggered: true,
          phase: 'day_vote',
          phaseEndsAt: Date.now() + PHASE_DURATION.day_vote,
        };
      } else {
        newState = resolved;
      }
    } else {
      return null;
    }

    game.boardState = newState;
    game.updatedAt = Date.now();
    await redis.set(`game:${roomId}`, JSON.stringify(game), { EX: TTL });
    return game;
  },

  async applyMove(
    roomId: string,
    playerId: string,
    moveData: Record<string, unknown>,
  ): Promise<{ game: GameState; result: GameResult | null }> {
    const lockKey = `lock:game:${roomId}`;
    const acquired = await redis.set(lockKey, '1', { NX: true, EX: 5 });
    if (!acquired) throw new AppError('CONFLICT', 'Another move is being processed', 409);

    try {
      const game = await GameService.getGame(roomId);
      if (!game) throw new AppError('NOT_FOUND', 'Game not found', 404);
      if (game.status !== 'in_progress') throw new AppError('GAME_OVER', 'Game is not active', 400);

      // For werewolf, any alive player can move (no turn enforcement)
      if (game.gameType !== 'werewolf' && game.currentTurn !== playerId) {
        throw new AppError('NOT_YOUR_TURN', 'Not your turn', 400);
      }

      const engine = EngineRegistry.get(game.gameType);
      const { newBoardState, isValid } = engine.validateAndApply(
        game.boardState,
        moveData,
        playerId,
      );
      if (!isValid) throw new AppError('INVALID_MOVE', 'Invalid move', 400);

      // For werewolf, only check win condition when a phase transition happened inline
      // (i.e. all players voted → resolveVote ran). Mid-night/discussion actions must not
      // trigger the win check because no one has died yet and wolves could falsely "win"
      // on equal counts. Phase-based win checks are handled in werewolf-phase.ts.
      const phaseBefore = game.gameType === 'werewolf'
        ? (game.boardState as import('../engines/werewolf/types').WerewolfState).phase
        : null;

      game.moves.push({ playerId, moveData, timestamp: Date.now(), moveIndex: game.moves.length });
      game.boardState = newBoardState;
      game.updatedAt = Date.now();

      if (game.gameType !== 'werewolf') {
        const nextPlayer = game.players.find((p) => p.userId !== playerId)!;
        game.currentTurn = nextPlayer.userId;
      }

      const phaseAfter = game.gameType === 'werewolf'
        ? (newBoardState as import('../engines/werewolf/types').WerewolfState).phase
        : null;
      const shouldCheckResult = game.gameType !== 'werewolf' || phaseBefore !== phaseAfter;

      let result: GameResult | null = null;
      const engineResult = shouldCheckResult ? engine.checkResult(newBoardState, game.players) : null;
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
        db.query(
          'UPDATE games SET status = $1, winner_id = $2, is_draw = $3, finished_at = NOW() WHERE id = $4',
          ['finished', result.winner ?? null, result.isDraw, game.id],
        ).catch(() => {});
      }

      await redis.set(`game:${roomId}`, JSON.stringify(game), { EX: TTL });
      return { game, result };
    } finally {
      await redis.del(lockKey);
    }
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
    db.query('UPDATE games SET status = $1, winner_id = $2, finished_at = NOW() WHERE id = $3', [
      'finished',
      winner.userId,
      game.id,
    ]).catch(() => {});
    return result;
  },

  calcRatingChanges(players: GameState['players'], winnerId?: string): Record<string, number> {
    if (!winnerId) return Object.fromEntries(players.map((p) => [p.userId, 0]));
    const loser = players.find((p) => p.userId !== winnerId)!;
    return { [winnerId]: 15, [loser.userId]: -15 };
  },
};
