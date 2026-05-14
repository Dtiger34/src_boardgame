import { ROLE_IMAGES, ROLE_ICONS } from '../constants';
import { useTranslation } from 'react-i18next';

interface RoleCardProps {
  myRole: string;
  cardRevealed: boolean;
  onCardReveal: (revealed: boolean) => void;
  roleLabel: Record<string, string>;
  roleDesc: Record<string, string>;
  wolfTeamIds: string[];
  getUsername: (userId: string) => string;
  investigateResult?: boolean;
  investigateTarget?: string;
  isSeer: boolean;
  isSheriff: boolean;
  sisterIds?: string[];
  brotherIds?: string[];
  round: number;
}

export function RoleCard({
  myRole,
  cardRevealed,
  onCardReveal,
  roleLabel,
  roleDesc,
  wolfTeamIds,
  getUsername,
  investigateResult,
  investigateTarget,
  isSeer,
  isSheriff,
  sisterIds,
  brotherIds,
  round,
}: RoleCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900 rounded-2xl p-5">
      <div className="text-center mb-3">
        {/* Flip card */}
        <div
          className="relative w-40 h-56 mx-auto mb-2 select-none cursor-pointer"
          style={{ perspective: '600px' }}
          onMouseDown={() => onCardReveal(true)}
          onMouseUp={() => onCardReveal(false)}
          onMouseLeave={() => onCardReveal(false)}
          onTouchStart={() => onCardReveal(true)}
          onTouchEnd={() => onCardReveal(false)}
        >
          <div
            className="absolute inset-0 transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: cardRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Mặt sau (úp) */}
            <div
              className="absolute inset-0 rounded-xl border border-gray-600 bg-gray-800 flex flex-col items-center justify-center gap-1"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-3xl">🂠</span>
              <span className="text-xs text-gray-400">{t('werewolf.holdToReveal')}</span>
            </div>
            {/* Mặt trước (role) */}
            <div
              className="absolute inset-0 rounded-xl border border-gray-700 overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {ROLE_IMAGES[myRole] ? (
                <img
                  src={ROLE_IMAGES[myRole]}
                  alt={myRole}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-800">
                  {ROLE_ICONS[myRole] ?? '❓'}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>{t('werewolf.myRole')}</div>
        <div className="text-lg font-bold text-white">{cardRevealed ? (roleLabel[myRole] ?? myRole) : '???'}</div>
        <div className="text-sm text-gray-400 mt-1">{cardRevealed ? (roleDesc[myRole] ?? '') : ''}</div>
      </div>
      {wolfTeamIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 font-semibold">{t('werewolf.yourPack')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {wolfTeamIds.map((wid) => (
              <span key={wid} className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full">
                {getUsername(wid)}
              </span>
            ))}
          </div>
        </div>
      )}
      {round === 1 && sisterIds && sisterIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-pink-400 font-semibold">{t('werewolf.sisterLabel')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {sisterIds.filter((id) => id !== undefined).map((sid) => (
              <span key={sid} className="text-xs bg-pink-900 text-pink-200 px-2 py-0.5 rounded-full">
                {getUsername(sid)}
              </span>
            ))}
          </div>
        </div>
      )}
      {round === 1 && brotherIds && brotherIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-blue-400 font-semibold">{t('werewolf.brotherLabel')}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {brotherIds.filter((id) => id !== undefined).map((bid) => (
              <span key={bid} className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full">
                {getUsername(bid)}
              </span>
            ))}
          </div>
        </div>
      )}
      {(isSeer || isSheriff) && investigateResult !== undefined && investigateTarget && (
        <div className={`mt-3 pt-3 border-t border-gray-700 rounded-lg p-2 text-sm text-center font-semibold ${investigateResult ? 'text-red-300 bg-red-950' : 'text-green-300 bg-green-950'}`}>
          {getUsername(investigateTarget)}: {investigateResult
            ? t('werewolf.investigateResultWolf')
            : t('werewolf.investigateResultSafe')}
        </div>
      )}
    </div>
  );
}
