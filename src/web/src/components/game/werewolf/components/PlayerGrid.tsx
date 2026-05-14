import { playerImg } from '../constants';

interface Player {
  userId: string;
  username: string;
}

interface DeadPlayer {
  userId: string;
  revealedRole: string;
}

interface PlayerGridProps {
  players: Player[];
  aliveSet: Set<string>;
  deadPlayers: DeadPlayer[];
  votes: Record<string, string | null>;
  phase: 'night' | 'day_discussion' | 'day_vote';
  myUserId: string;
  playersLabel: string;
}

export function PlayerGrid({ players, aliveSet, deadPlayers, votes, phase, myUserId, playersLabel }: PlayerGridProps) {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    if (targetId) tally[targetId] = (tally[targetId] ?? 0) + 1;
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {playersLabel}
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {players.map((player) => {
          const alive = aliveSet.has(player.userId);
          const deadInfo = deadPlayers.find((d) => d.userId === player.userId);
          const voteCount = tally[player.userId] ?? 0;
          const hasVotedFor = votes[myUserId] === player.userId;
          const isMe = player.userId === myUserId;
          return (
            <div key={player.userId} className="flex flex-col gap-1">
              <div
                className={`relative rounded-xl overflow-hidden border transition
                  ${alive ? 'border-gray-700' : 'border-gray-700 opacity-40 grayscale'}
                  ${hasVotedFor ? 'ring-2 ring-orange-400' : ''}
                `}
              >
                <img
                  src={playerImg}
                  alt={player.username}
                  className="w-full aspect-[3/4] object-cover"
                />
                {/* Vote badge */}
                {phase === 'day_vote' && alive && voteCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 text-xs bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                    {voteCount}
                  </span>
                )}
                {/* Dead overlay */}
                {deadInfo && (
                  <span className="absolute top-1.5 left-1.5 text-lg leading-none drop-shadow">
                    ☠
                  </span>
                )}
              </div>
              <p className={`text-xs font-medium truncate text-center ${alive ? 'text-white' : 'text-gray-500'}`}>
                {player.username}{isMe && <span className="text-indigo-400"> ★</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
