import { GamePlayer } from '@boardgame/types';
import { AppError } from '../middleware/error-handler';

export interface GameEngine {
  getInitialState(): unknown;
  validateAndApply(
    boardState: unknown,
    move: Record<string, unknown>,
    playerId: string,
  ): { newBoardState: unknown; isValid: boolean };
  checkResult(
    boardState: unknown,
    players: GamePlayer[],
  ): { winner?: string; isDraw: boolean; reason: string } | null;
}

const engines = new Map<string, GameEngine>();

export const EngineRegistry = {
  register(gameType: string, engine: GameEngine) {
    engines.set(gameType, engine);
  },
  get(gameType: string): GameEngine {
    const engine = engines.get(gameType);
    if (!engine) throw new AppError('UNKNOWN_GAME_TYPE', `Unknown game type: ${gameType}`);
    return engine;
  },
};
