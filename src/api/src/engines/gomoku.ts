import { GamePlayer } from '@boardgame/types';
import { EngineRegistry, GameEngine } from './registry';

const SIZE = 15;
type Cell = 0 | 1 | 2;

interface State {
  board: Cell[][];
  moveCount: number;
}

const GomokuEngine: GameEngine = {
  getInitialState(): State {
    return {
      board: Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as Cell[]),
      moveCount: 0,
    };
  },

  validateAndApply(boardState, move, _playerId) {
    const state = boardState as State;
    const { row, col } = move as { row: number; col: number };
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE || state.board[row][col] !== 0) {
      return { newBoardState: state, isValid: false };
    }
    const newBoard = state.board.map((r) => [...r]) as Cell[][];
    newBoard[row][col] = (state.moveCount % 2 === 0 ? 1 : 2) as Cell;
    return { newBoardState: { board: newBoard, moveCount: state.moveCount + 1 }, isValid: true };
  },

  checkResult(boardState, players) {
    const { board } = boardState as State;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r][c];
        if (!cell) continue;
        for (const [dr, dc] of dirs) {
          let n = 1;
          for (let i = 1; i < 5; i++) {
            const nr = r + dr * i, nc = c + dc * i;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== cell) break;
            n++;
          }
          if (n >= 5) return { winner: players[cell - 1].userId, isDraw: false, reason: 'five_in_a_row' };
        }
      }
    }
    if (board.every((row) => row.every((c) => c !== 0))) return { isDraw: true, reason: 'board_full' };
    return null;
  },
};

EngineRegistry.register('gomoku', GomokuEngine);
