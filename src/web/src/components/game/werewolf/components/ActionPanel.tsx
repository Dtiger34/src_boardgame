import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ActionPanelProps {
  phase: 'night' | 'day_discussion' | 'day_vote';
  isAlive: boolean;
  isWolf: boolean;
  isGuard: boolean;
  isSeer: boolean;
  myRole: string;
  myTeam: string;
  witchSaveUsed?: boolean;
  witchPoisonUsed?: boolean;
  witchKillTarget?: string;
  hasActed: boolean;
  aliveNonWolves: string[];
  aliveAll: string[];
  wolfTeamIds: string[];
  myUserId: string;
  myVote: string | null | undefined;
  tally: Record<string, number>;
  myWolfVote: string | undefined;
  wolfKillTally: Record<string, number>;
  alivePlayers: string[];
  countdown: number;
  getUsername: (userId: string) => string;
  hunterTarget?: string;
  doAction: (action: string, targetId?: string) => void;
  doWitchAction: (action: string, targetId?: string) => void;
  doHunterAction: (action: string, targetId?: string) => void;
  doCupidAction: (targetId: string, targetId2: string) => void;
  nightActionsDone: Record<string, boolean>;
  wolfFatherUsed: boolean;
  wolfSorcererUses: number;
  bigBadWolfKillsActive: boolean;
  stutteringJudgeUsed: boolean;
  thiefCards?: [string, string];
  round: number;
  disabledByWolfSorcerer?: boolean;
}

export function ActionPanel({
  phase,
  isAlive,
  isWolf,
  isGuard,
  isSeer,
  myRole,
  myTeam,
  witchSaveUsed,
  witchPoisonUsed,
  witchKillTarget,
  hasActed,
  aliveNonWolves,
  aliveAll,
  wolfTeamIds,
  myUserId,
  myVote,
  tally,
  myWolfVote,
  wolfKillTally,
  alivePlayers,
  countdown,
  getUsername,
  doAction,
  doWitchAction,
  hunterTarget,
  doHunterAction,
  doCupidAction,
  nightActionsDone,
  wolfFatherUsed,
  wolfSorcererUses,
  bigBadWolfKillsActive,
  stutteringJudgeUsed,
  thiefCards,
  round,
  disabledByWolfSorcerer,
}: ActionPanelProps) {
  const { t } = useTranslation();
  const [cupidFirst, setCupidFirst] = useState<string | null>(null);

  const isSpecialNightRole =
    isWolf ||
    isGuard ||
    isSeer ||
    myRole === 'witch' ||
    myRole === 'cupid' ||
    myRole === 'wild_child' ||
    myRole === 'hunter' ||
    myRole === 'dog_wolf' ||
    myRole === 'wolf_sorcerer' ||
    myRole === 'big_bad_wolf' ||
    myRole === 'thief' ||
    myRole === 'devoted_servant' ||
    myRole === 'impersonator' ||
    myRole === 'avenger';

  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex-1">
      {phase === 'night' && isAlive && disabledByWolfSorcerer && (
        <div className="mb-3 rounded-lg bg-purple-950 border border-purple-700 px-3 py-2 text-sm text-purple-300">
          🔮 {t('werewolf.disabledByWolfSorcerer')}
        </div>
      )}
      {phase === 'night' && isAlive && (
        <>
          {isWolf && (
            <div>
              {myWolfVote !== undefined ? (
                <p className="text-red-400 text-sm mb-3">
                  {t('werewolf.wolfVotedFor', { name: getUsername(myWolfVote) })}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mb-3">{t('werewolf.pickToKill')}</p>
              )}
              <div className="space-y-2">
                {aliveNonWolves.map((id) => (
                  <button
                    key={id}
                    onClick={() => doAction('kill', id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      myWolfVote === id
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : 'bg-red-900 hover:bg-red-800 text-red-100'
                    }`}
                  >
                    🎯 {getUsername(id)}
                    {wolfKillTally[id] ? (
                      <span className="ml-2 text-xs text-red-300">({wolfKillTally[id]})</span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Dog Wolf: choose side on round 1 */}
              {myRole === 'dog_wolf' && round === 1 && !hasActed && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-400">{t('werewolf.dogWolfChooseSide')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => doAction('dog_wolf_choose', 'village')}
                      className="flex-1 px-3 py-2 bg-green-900 hover:bg-green-800 rounded-lg text-sm text-green-100 transition"
                    >
                      {t('werewolf.sideVillage')}
                    </button>
                    <button
                      onClick={() => doAction('dog_wolf_choose', 'werewolf')}
                      className="flex-1 px-3 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm text-red-100 transition"
                    >
                      {t('werewolf.sideWolf')}
                    </button>
                  </div>
                </div>
              )}

              {/* Wolf Father: convert instead of kill */}
              {myRole === 'wolf_father' && !wolfFatherUsed && (
                <div className="mt-3">
                  <button
                    onClick={() => doAction('wolf_father_convert')}
                    className="w-full text-left px-3 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm text-red-100 transition"
                  >
                    {t('werewolf.wolfFatherConvert')}
                  </button>
                </div>
              )}

              {/* White Wolf: kill a wolf on even rounds */}
              {myRole === 'white_wolf' && round % 2 === 0 && !nightActionsDone['white_wolf'] && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-2">{t('werewolf.whiteWolfKill')}</p>
                  <div className="space-y-2">
                    {wolfTeamIds
                      .filter((id) => id !== myUserId && alivePlayers.includes(id))
                      .map((id) => (
                        <button
                          key={id}
                          onClick={() => doAction('white_wolf_kill', id)}
                          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-100 transition"
                        >
                          🗡 {getUsername(id)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Wolf Sorcerer: disable a villager */}
              {myRole === 'wolf_sorcerer' &&
                wolfSorcererUses < 2 &&
                !nightActionsDone['wolf_sorcerer'] && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-400 mb-2">
                      {t('werewolf.wolfSorcererDisable', { uses: 2 - wolfSorcererUses })}
                    </p>
                    <div className="space-y-2">
                      {aliveNonWolves
                        .filter((id) => id !== myUserId)
                        .map((id) => (
                          <button
                            key={id}
                            onClick={() => doAction('wolf_sorcerer_disable', id)}
                            className="w-full text-left px-3 py-2 bg-violet-900 hover:bg-violet-800 rounded-lg text-sm text-violet-100 transition"
                          >
                            🔮 {getUsername(id)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

              {/* Big Bad Wolf: extra kill */}
              {myRole === 'big_bad_wolf' && bigBadWolfKillsActive && !hasActed && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-2">{t('werewolf.bigBadWolfExtraKill')}</p>
                  <div className="space-y-2">
                    {aliveNonWolves
                      .filter((id) => id !== myUserId)
                      .map((id) => (
                        <button
                          key={id}
                          onClick={() => doAction('big_bad_wolf_kill', id)}
                          className="w-full text-left px-3 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-sm text-red-100 transition"
                        >
                          💀 {getUsername(id)}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isGuard && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.pickToProtect')}</p>
              <div className="space-y-2">
                {aliveAll.map((id) => (
                  <button
                    key={id}
                    onClick={() => doAction('protect', id)}
                    className="w-full text-left px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded-lg text-sm text-blue-100 transition"
                  >
                    🛡 {getUsername(id)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSeer && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.pickToInvestigate')}</p>
              <div className="space-y-2">
                {aliveAll
                  .filter((id) => id !== myUserId)
                  .map((id) => (
                    <button
                      key={id}
                      onClick={() => doAction('investigate', id)}
                      className="w-full text-left px-3 py-2 bg-purple-900 hover:bg-purple-800 rounded-lg text-sm text-purple-100 transition"
                    >
                      🔍 {getUsername(id)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {myRole === 'hunter' && (
            <div>
              {hunterTarget !== undefined ? (
                <p className="text-amber-400 text-sm mb-3">{t('werewolf.hunterTarget', { name: getUsername(hunterTarget) })}</p>
              ) : (
                <p className="text-sm text-gray-400 mb-3">{t('werewolf.hunterPickTarget')}</p>
              )}
              <div className="space-y-2">
                {aliveAll
                  .filter((id) => id !== myUserId)
                  .map((id) => (
                    <button
                      key={id}
                      onClick={() =>
                        doHunterAction('hunter_target', hunterTarget === id ? undefined : id)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${hunterTarget === id ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-amber-900 hover:bg-amber-800 text-amber-100'}`}
                    >
                      🏹 {getUsername(id)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {myRole === 'witch' && (
            <WitchActionPanel
              witchSaveUsed={witchSaveUsed}
              witchPoisonUsed={witchPoisonUsed}
              aliveAll={aliveAll}
              myUserId={myUserId}
              getUsername={getUsername}
              doAction={doWitchAction}
            />
          )}

          {myRole === 'cupid' && round === 1 && !hasActed && (
            <div>
              {!cupidFirst ? (
                <>
                  <p className="text-sm text-gray-400 mb-3">{t('werewolf.cupidPickFirst')}</p>
                  <div className="space-y-2">
                    {aliveAll
                      .filter((id) => id !== myUserId)
                      .map((id) => (
                        <button
                          key={id}
                          onClick={() => setCupidFirst(id)}
                          className="w-full text-left px-3 py-2 bg-pink-900 hover:bg-pink-800 rounded-lg text-sm text-pink-100 transition"
                        >
                          💘 {getUsername(id)}
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-1">
                    {t('werewolf.cupidSelected', { name: getUsername(cupidFirst) })}
                  </p>
                  <p className="text-sm text-gray-400 mb-3">{t('werewolf.cupidPickSecond')}</p>
                  <div className="space-y-2">
                    {aliveAll
                      .filter((id) => id !== myUserId && id !== cupidFirst)
                      .map((id) => (
                        <button
                          key={id}
                          onClick={() => doCupidAction(cupidFirst, id)}
                          className="w-full text-left px-3 py-2 bg-pink-900 hover:bg-pink-800 rounded-lg text-sm text-pink-100 transition"
                        >
                          💘 {getUsername(id)}
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => setCupidFirst(null)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition"
                  >
                    {t('werewolf.cupidReselect')}
                  </button>
                </>
              )}
            </div>
          )}

          {myRole === 'wild_child' && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.wildChildPickModel')}</p>
              <div className="space-y-2">
                {aliveAll
                  .filter((id) => id !== myUserId)
                  .map((id) => (
                    <button
                      key={id}
                      onClick={() => doAction('wild_child_model', id)}
                      className="w-full text-left px-3 py-2 bg-cyan-900 hover:bg-cyan-800 rounded-lg text-sm text-cyan-100 transition"
                    >
                      ⭐ {getUsername(id)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Thief: choose a role card on round 1 */}
          {myRole === 'thief' && thiefCards && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.thiefPickRole')}</p>
              <div className="space-y-2">
                {thiefCards.map((card) => (
                  <button
                    key={card}
                    onClick={() => doAction('thief_choose', card)}
                    className="w-full text-left px-3 py-2 bg-yellow-900 hover:bg-yellow-800 rounded-lg text-sm text-yellow-100 transition"
                  >
                    🃏 {card}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Devoted Servant: observe on round 1 */}
          {myRole === 'devoted_servant' && round === 1 && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.devotedServantFollow')}</p>
              <div className="space-y-2">
                {aliveAll
                  .filter((id) => id !== myUserId)
                  .map((id) => (
                    <button
                      key={id}
                      onClick={() => doAction('devoted_servant_follow', id)}
                      className="w-full text-left px-3 py-2 bg-indigo-900 hover:bg-indigo-800 rounded-lg text-sm text-indigo-100 transition"
                    >
                      🕯 {getUsername(id)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Impersonator: observe on round 1 */}
          {myRole === 'impersonator' && round === 1 && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.impersonatorObserve')}</p>
              <div className="space-y-2">
                {aliveAll
                  .filter((id) => id !== myUserId)
                  .map((id) => (
                    <button
                      key={id}
                      onClick={() => doAction('impersonator_follow', id)}
                      className="w-full text-left px-3 py-2 bg-teal-900 hover:bg-teal-800 rounded-lg text-sm text-teal-100 transition"
                    >
                      🎭 {getUsername(id)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Avenger: choose side on round 1 */}
          {myRole === 'avenger' && round === 1 && myTeam === 'third_party' && !hasActed && (
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('werewolf.avengerChooseSide')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => doAction('avenger_choose', 'village')}
                  className="flex-1 px-3 py-2 bg-green-900 hover:bg-green-800 rounded-lg text-sm text-green-100 transition"
                >
                  {t('werewolf.sideVillage')}
                </button>
                <button
                  onClick={() => doAction('avenger_choose', 'werewolf')}
                  className="flex-1 px-3 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm text-red-100 transition"
                >
                  {t('werewolf.sideWolf')}
                </button>
              </div>
            </div>
          )}

          {!isSpecialNightRole && (
            <p className="text-gray-500 text-sm text-center">{t('werewolf.waitingNight')}</p>
          )}
          {!isWolf && myRole !== 'witch' && hasActed && (
            <p className="text-green-400 text-sm text-center">{t('werewolf.alreadyActed')}</p>
          )}
        </>
      )}

      {phase === 'day_discussion' && (
        <>
          <p className="text-gray-400 text-sm text-center">
            {t('werewolf.waitingDiscussion', { s: countdown })}
          </p>
          {/* Stuttering Judge: trigger second vote */}
          {myRole === 'stuttering_judge' && isAlive && (
            <div className="mt-3">
              {stutteringJudgeUsed ? (
                <p className="text-xs text-yellow-400 text-center">
                  ⚖️ {t('werewolf.stutteringJudgeActivated')}
                </p>
              ) : (
                <button
                  onClick={() => doAction('stuttering_judge_signal')}
                  className="w-full text-left px-3 py-2 bg-yellow-900 hover:bg-yellow-800 rounded-lg text-sm text-yellow-100 transition"
                >
                  {t('werewolf.stutteringJudgeActivate')}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {phase === 'day_vote' && isAlive && (
        <div>
          {myVote !== undefined ? (
            <p className="text-yellow-400 text-sm mb-3">
              {t('werewolf.votedFor', {
                name: myVote ? getUsername(myVote) : t('werewolf.skipVote'),
              })}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-3">{t('werewolf.voteTitle')}</p>
          )}
          <div className="space-y-2">
            {alivePlayers
              .filter((id) => id !== myUserId)
              .map((id) => (
                <button
                  key={id}
                  onClick={() => doAction('vote', myVote === id ? undefined : id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${myVote === id ? 'bg-orange-600 text-white ring-2 ring-orange-400' : 'bg-orange-900 hover:bg-orange-800 text-orange-100'}`}
                >
                  ⚖️ {getUsername(id)}
                  {tally[id] ? (
                    <span className="ml-2 text-xs text-orange-300">({tally[id]})</span>
                  ) : null}
                </button>
              ))}
            <button
              onClick={() => doAction('vote')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${myVote === null ? 'bg-gray-500 text-white ring-2 ring-gray-400' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              {t('werewolf.skipVote')}
            </button>
          </div>
        </div>
      )}

      {!isAlive && <p className="text-gray-500 text-sm text-center">☠ {t('werewolf.dead')}</p>}
    </div>
  );
}

function WitchActionPanel({
  witchSaveUsed,
  witchPoisonUsed,
  aliveAll,
  myUserId,
  getUsername,
  doAction,
}: {
  witchSaveUsed?: boolean;
  witchPoisonUsed?: boolean;
  aliveAll: string[];
  myUserId: string;
  getUsername: (id: string) => string;
  doAction: (action: string, targetId?: string) => void;
}) {
  const { t } = useTranslation();
  const [saveTarget, setSaveTarget] = useState<string | null>(null);
  const [poisonTarget, setPoisonTarget] = useState<string | null>(null);

  function toggleSave(id: string) {
    const next = saveTarget === id ? null : id;
    setSaveTarget(next);
    doAction('witch_save', next ?? undefined);
  }

  function togglePoison(id: string) {
    const next = poisonTarget === id ? null : id;
    setPoisonTarget(next);
    doAction('witch_poison', next ?? undefined);
  }

  return (
    <div className="space-y-4">
      {!witchSaveUsed && (
        <div>
          {saveTarget !== null ? (
            <p className="text-emerald-400 text-sm mb-3">{t('werewolf.witchSaveSelected', { name: getUsername(saveTarget) })}</p>
          ) : (
            <p className="text-sm text-gray-400 mb-3">{t('werewolf.witchPickSave')}</p>
          )}
          <div className="space-y-2">
            {aliveAll.map((id) => (
              <button
                key={`save-${id}`}
                onClick={() => toggleSave(id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${saveTarget === id ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' : 'bg-emerald-900 hover:bg-emerald-800 text-emerald-100'}`}
              >
                💚 {getUsername(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!witchPoisonUsed && (
        <div>
          {poisonTarget !== null ? (
            <p className="text-fuchsia-400 text-sm mb-3">{t('werewolf.witchPoisonSelected', { name: getUsername(poisonTarget) })}</p>
          ) : (
            <p className="text-sm text-gray-400 mb-3">{t('werewolf.witchPickPoison')}</p>
          )}
          <div className="space-y-2">
            {aliveAll
              .filter((id) => id !== myUserId)
              .map((id) => (
                <button
                  key={`poison-${id}`}
                  onClick={() => togglePoison(id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${poisonTarget === id ? 'bg-fuchsia-600 text-white ring-2 ring-fuchsia-400' : 'bg-fuchsia-900 hover:bg-fuchsia-800 text-fuchsia-100'}`}
                >
                  ☠ {getUsername(id)}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
