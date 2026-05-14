import { useTranslation } from 'react-i18next';

interface PhaseBannerProps {
  phase: 'night' | 'day_discussion' | 'day_vote';
  round: number;
  countdown: number;
  isHost: boolean;
  roomId: string;
  onSkipPhase: (roomId: string) => void;
}

export function PhaseBanner({ phase, round, countdown, isHost, roomId, onSkipPhase }: PhaseBannerProps) {
  const { t } = useTranslation();

  const phaseLabel =
    phase === 'night' ? t('werewolf.night')
      : phase === 'day_discussion' ? t('werewolf.dayDiscussion')
        : t('werewolf.dayVote');

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-white">
          {phase === 'night' ? '🌙' : phase === 'day_discussion' ? '☀️' : '⚖️'} {phaseLabel}
        </div>
        <div className="text-gray-400 text-sm mt-1">
          {t('werewolf.round', { n: round })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-mono font-bold text-yellow-400">
          {countdown}s
        </div>
        {isHost && (
          <button
            onClick={() => onSkipPhase(roomId)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
          >
            ⏭ {t('werewolf.skipPhase')}
          </button>
        )}
      </div>
    </div>
  );
}
