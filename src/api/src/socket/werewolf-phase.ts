import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@boardgame/types';
import { GameService } from '../services/game.service';
import { getPrivateInfo, WerewolfState } from '../engines/werewolf';
import { EngineRegistry } from '../engines/registry';
import { logger } from '../logger';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

const timers = new Map<string, NodeJS.Timeout>();

export async function skipPhase(io: IO, roomId: string): Promise<void> {
  clearPhaseTimer(roomId);
  await handlePhaseExpire(io, roomId);
}

export function schedulePhase(io: IO, roomId: string, delayMs: number): void {
  clearPhaseTimer(roomId);
  const t = setTimeout(
    () => {
      timers.delete(roomId);
      handlePhaseExpire(io, roomId).catch((e) => logger.error(e));
    },
    Math.max(delayMs, 0),
  );
  timers.set(roomId, t);
}

export function clearPhaseTimer(roomId: string): void {
  const t = timers.get(roomId);
  if (t) {
    clearTimeout(t);
    timers.delete(roomId);
  }
}

async function handlePhaseExpire(io: IO, roomId: string): Promise<void> {
  const game = await GameService.advancePhase(roomId);
  if (!game) return;

  const publicGame = GameService.scrubGameState(game);
  io.to(`room:${roomId}`).emit('game:state', publicGame);

  for (const player of game.players) {
    const info = GameService.getWerewolfPrivateInfo(game, player.userId);
    if (info) io.to(`user:${player.userId}`).emit('game:private_info', info);
  }

  // Check win condition
  const engine = EngineRegistry.get('werewolf');
  const result = engine.checkResult(game.boardState, game.players);
  if (result) {
    const state = game.boardState as WerewolfState;
    const allRoles: Record<string, string> = {};
    for (const p of state.players) allRoles[p.userId] = p.role;
    const gameResult = {
      gameId: game.id,
      winner: result.winner,
      isDraw: result.isDraw,
      reason: result.reason,
      ratingChanges: {} as Record<string, number>,
      allRoles,
    };
    io.to(`room:${roomId}`).emit('game:result', gameResult);
    clearPhaseTimer(roomId);
    const updatedRoom = await GameService.resetReadyStates(roomId);
    if (updatedRoom) io.to(`room:${roomId}`).emit('game:room_update', updatedRoom);
    return;
  }

  // Schedule next phase timer
  const state = game.boardState as WerewolfState;
  schedulePhase(io, roomId, state.phaseEndsAt - Date.now());
}
