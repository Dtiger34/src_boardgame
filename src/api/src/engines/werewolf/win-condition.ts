import type { GamePlayer } from '@boardgame/types';
import type { WerewolfState } from './types';
import { aliveWolves, aliveVillagers } from './helpers';

export function checkWinCondition(
  state: WerewolfState,
  players: GamePlayer[],
): { winner?: string; isDraw: boolean; reason: string } | null {
  // Special winner (jester, angel, white wolf)
  if (state.specialWinner) {
    return { winner: state.specialWinner.userId, isDraw: false, reason: state.specialWinner.reason };
  }

  const wolves = aliveWolves(state);
  const villagers = aliveVillagers(state);

  if (wolves.length === 0) {
    const rep = players.find((p) =>
      state.players.find((i) => i.userId === p.userId && i.team === 'village' && i.isAlive),
    );
    return { winner: rep?.userId, isDraw: false, reason: 'village_eliminated_wolves' };
  }

  if (wolves.length >= villagers.length) {
    const wolfRep = players.find((p) =>
      state.players.find((i) => i.userId === p.userId && i.team === 'werewolf' && i.isAlive),
    );
    return { winner: wolfRep?.userId, isDraw: false, reason: 'werewolves_outnumber_village' };
  }

  // White wolf: only one player alive and it's white wolf
  const aliveAll = state.players.filter((p) => p.isAlive);
  if (aliveAll.length === 1 && aliveAll[0].role === 'white_wolf') {
    return { winner: aliveAll[0].userId, isDraw: false, reason: 'white_wolf_last_standing' };
  }

  // Lovers third_party: only the two lovers remain
  if (state.lovers) {
    const [a, b] = state.lovers;
    const pa = state.players.find((p) => p.userId === a);
    const pb = state.players.find((p) => p.userId === b);
    if (pa?.isAlive && pb?.isAlive && aliveAll.length === 2) {
      return { winner: a, isDraw: false, reason: 'lovers_last_standing' };
    }
  }

  return null;
}
