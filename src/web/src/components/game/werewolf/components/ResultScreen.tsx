import { useTranslation } from 'react-i18next';
import { ROLE_ICONS } from '../constants';
import type { GameEventType, GameEvent } from '../types';

interface Player {
  userId: string;
  username: string;
}

interface DeadPlayer {
  userId: string;
  revealedRole: string;
}

interface ResultScreenProps {
  villageWon: boolean;
  iWon: boolean;
  allPlayers: Player[];
  deadList: DeadPlayer[];
  survivorIds: Set<string>;
  eventLog: GameEvent[];
  myUserId: string;
  myRole: string | undefined;
  allRoles: Record<string, string> | undefined;
  roleLabel: Record<string, string>;
  onPlayAgain: () => void;
}

const NIGHT_EVENTS = new Set<GameEventType>([
  'killed_by_wolves',
  'killed_by_witch',
  'protected',
  'wolf_father_converted',
  'cursed_converted',
  'rusty_knight_wolf_dies',
  'white_wolf_kills',
  'wild_child_converted',
]);

const WOLF_ROLES = new Set([
  'werewolf',
  'wolf_cub',
  'big_bad_wolf',
  'wolf_father',
  'hidden_wolf',
  'wolf_sorcerer',
  'dog_wolf',
  'white_wolf',
]);

export function ResultScreen({
  villageWon,
  iWon,
  allPlayers,
  deadList,
  survivorIds,
  eventLog,
  myUserId,
  myRole,
  allRoles,
  roleLabel,
  onPlayAgain,
}: ResultScreenProps) {
  const { t } = useTranslation();

  function getName(uid: string) {
    return allPlayers.find((p) => p.userId === uid)?.username ?? uid;
  }

  function getRole(uid: string): string | undefined {
    if (allRoles) return allRoles[uid];
    const dead = deadList.find((d) => d.userId === uid);
    return dead?.revealedRole ?? (uid === myUserId ? myRole : undefined);
  }

  function roleChip(role: string | undefined) {
    if (!role) return null;
    const isWolf = WOLF_ROLES.has(role);
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isWolf ? 'bg-red-900/80 text-red-200' : 'bg-gray-700 text-gray-200'
        }`}
      >
        {ROLE_ICONS[role] ?? ''} {roleLabel[role] ?? role}
      </span>
    );
  }

  const EVENT_TEXT: Record<GameEventType, (e: GameEvent) => string> = {
    killed_by_wolves: (e) => t('werewolf.eventKilledByWolves', { name: getName(e.userId) }),
    killed_by_witch: (e) => t('werewolf.eventKilledByWitch', { name: getName(e.userId) }),
    executed: (e) => t('werewolf.eventExecuted', { name: getName(e.userId) }),
    protected: (e) => t('werewolf.eventProtected', { name: getName(e.userId) }),
    no_execute: () => t('werewolf.eventNoExecute'),
    lover_died: (e) => t('werewolf.eventLoverDied', { name: getName(e.userId) }),
    wolf_father_converted: (e) => t('werewolf.eventWolfFatherConverted', { name: getName(e.userId) }),
    cursed_converted: (e) => t('werewolf.eventCursedConverted', { name: getName(e.userId) }),
    rusty_knight_wolf_dies: (e) => t('werewolf.eventRustyKnightWolfDies', { name: getName(e.userId) }),
    white_wolf_kills: (e) => t('werewolf.eventWhiteWolfKills', { name: getName(e.userId) }),
    fool_revealed: (e) => t('werewolf.eventFoolRevealed', { name: getName(e.userId) }),
    hunter_kills: (e) => t('werewolf.eventHunterKills', { shooter: getName(e.extra ?? ''), name: getName(e.userId) }),
    wild_child_converted: (e) => t('werewolf.eventWildChildConverted', { name: getName(e.userId) }),
  };

  const rounds = Array.from(new Set(eventLog.map((e) => e.round))).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-6 p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">{villageWon ? '🏘' : '🐺'}</div>
          <div className="text-2xl font-bold text-white mb-1">
            {villageWon ? t('werewolf.resultVillageWin') : t('werewolf.resultWolfWin')}
          </div>
          <div className={`text-lg font-semibold ${iWon ? 'text-green-400' : 'text-red-400'}`}>
            {iWon ? t('werewolf.resultYouWin') : t('werewolf.resultYouLose')}
          </div>
        </div>

        {/* Vai trò từng người */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-300 mb-3">{t('werewolf.resultRolesTitle')}</div>
          <div className="space-y-2">
            {allPlayers.map((p) => {
              const role = getRole(p.userId);
              const alive = survivorIds.has(p.userId);
              return (
                <div key={p.userId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-sm font-medium truncate ${alive ? 'text-white' : 'text-gray-400'}`}
                    >
                      {p.username}
                      {p.userId === myUserId && <span className="text-indigo-400 ml-1">★</span>}
                    </span>
                    {alive ? (
                      <span className="text-xs text-green-500 shrink-0">{t('werewolf.resultAlive')}</span>
                    ) : (
                      <span className="text-xs text-red-500 shrink-0">☠</span>
                    )}
                  </div>
                  {role ? roleChip(role) : <span className="text-xs text-gray-600 italic">{t('werewolf.resultHidden')}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Diễn biến ván */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-300 mb-3">{t('werewolf.resultEventTitle')}</div>
          {rounds.length === 0 ? (
            <p className="text-xs text-gray-500">{t('werewolf.resultNoEvents')}</p>
          ) : (
            <div className="space-y-5">
              {rounds.map((round) => {
                const roundEvents = eventLog.filter((e) => e.round === round);
                const nightEvents = roundEvents.filter((e) => NIGHT_EVENTS.has(e.type));
                const dayEvents = roundEvents.filter((e) => !NIGHT_EVENTS.has(e.type));
                return (
                  <div key={round}>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                      {t('werewolf.resultRound', { n: round })}
                    </div>
                    <div className="pl-2 space-y-3">
                      {nightEvents.length > 0 && (
                        <div>
                          <div className="text-xs text-indigo-400 font-semibold mb-1">{t('werewolf.resultNight')}</div>
                          <div className="space-y-1 pl-3 border-l-2 border-indigo-900">
                            {nightEvents.map((e, i) => (
                              <div key={i} className="text-sm text-gray-200">
                                {EVENT_TEXT[e.type]?.(e) ?? e.type}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {dayEvents.length > 0 && (
                        <div>
                          <div className="text-xs text-yellow-400 font-semibold mb-1">{t('werewolf.resultDay')}</div>
                          <div className="space-y-1 pl-3 border-l-2 border-yellow-900">
                            {dayEvents.map((e, i) => (
                              <div key={i} className="text-sm text-gray-200">
                                {EVENT_TEXT[e.type]?.(e) ?? e.type}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => onPlayAgain()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition self-center"
        >
          {t('werewolf.playAgain')}
        </button>
      </div>
    </div>
  );
}
