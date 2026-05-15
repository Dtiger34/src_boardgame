import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_ICONS } from '@/components/game/werewolf/constants';

interface Props {
  playerCount: number;
  customRoles: Record<string, number> | undefined;
  isHost: boolean;
  roleLabel: Record<string, string>;
  onSave: (roles: Record<string, number>) => void;
  onReset: () => void;
}

type RoleGroup = { labelKey: string; color: string; roles: string[] };

const ROLE_GROUPS: RoleGroup[] = [
  {
    labelKey: 'roomLobby.groupVillage',
    color: 'text-green-400',
    roles: [
      'villager',
      'seer',
      'guard',
      'hunter',
      'witch',
      'sheriff',
      'cupid',
      'two_sisters',
      'three_brothers',
      'stuttering_judge',
      'rusty_knight',
      'wild_child',
      'fool',
      'drunk',
      'elder',
    ],
  },
  {
    labelKey: 'roomLobby.groupWolf',
    color: 'text-red-400',
    roles: [
      'werewolf',
      'wolf_cub',
      'dog_wolf',
      'big_bad_wolf',
      'wolf_father',
      'hidden_wolf',
      'wolf_sorcerer',
    ],
  },
  {
    labelKey: 'roomLobby.groupNeutral',
    color: 'text-yellow-400',
    roles: ['suicidal', 'white_wolf', 'angel', 'thief', 'cursed', 'avenger', 'impersonator'],
  },
];

const STACKABLE = new Set(['villager', 'werewolf']);

// Roles that must appear in exact fixed multiples (0 or fixed count)
const ROLE_FIXED: Record<string, number> = {
  two_sisters: 2,
  three_brothers: 3,
};

export function buildDefaultRoles(playerCount: number): Record<string, number> {
  const wolfCount = playerCount <= 6 ? 1 : playerCount <= 9 ? 2 : playerCount <= 12 ? 3 : 4;
  const roles: Record<string, number> = { werewolf: wolfCount };
  if (playerCount >= 4) roles['seer'] = 1;
  if (playerCount >= 7) roles['witch'] = 1;
  if (playerCount >= 8) roles['guard'] = 1;
  if (playerCount >= 9) roles['hunter'] = 1;
  if (playerCount >= 10) roles['sheriff'] = 1;
  if (playerCount >= 12) roles['cupid'] = 1;
  const special = Object.values(roles).reduce((s, n) => s + n, 0);
  roles['villager'] = Math.max(0, playerCount - special);
  return roles;
}

export function RoleEditor({ playerCount, customRoles, isHost, roleLabel, onSave, onReset }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Record<string, number>>(
    () => customRoles ?? buildDefaultRoles(playerCount),
  );
  const prevCustomRolesRef = useRef(customRoles);

  // Sync draft when server pushes updated customRoles
  useEffect(() => {
    if (customRoles !== prevCustomRolesRef.current) {
      prevCustomRolesRef.current = customRoles;
      setDraft(customRoles ?? buildDefaultRoles(playerCount));
    }
  }, [customRoles, playerCount]);

  // Adjust villager count when playerCount changes
  useEffect(() => {
    setDraft((prev) => {
      const prevTotal = Object.values(prev).reduce((s, n) => s + n, 0);
      if (prevTotal === playerCount) return prev;
      const diff = playerCount - prevTotal;
      const villagers = prev['villager'] ?? 0;
      const newVillagers = Math.max(0, villagers + diff);
      const next = { ...prev };
      if (newVillagers === 0) delete next['villager'];
      else next['villager'] = newVillagers;
      return next;
    });
  }, [playerCount]);

  const total = Object.values(draft).reduce((s, n) => s + n, 0);
  const isValid = total === playerCount;
  const diff = total - playerCount;

  function adjust(role: string, delta: number) {
    setDraft((prev) => {
      const next = { ...prev };
      const cur = next[role] ?? 0;
      const fixed = ROLE_FIXED[role];
      let val: number;
      if (fixed !== undefined) {
        // Toggle: 0 ↔ fixed count
        val = cur === 0 ? fixed : 0;
      } else {
        const max = STACKABLE.has(role) ? playerCount : 1;
        val = Math.max(0, Math.min(max, cur + delta));
      }
      if (val === 0) delete next[role];
      else next[role] = val;
      return next;
    });
  }

  function handleReset() {
    setDraft(buildDefaultRoles(playerCount));
    onReset();
  }

  function handleSave() {
    onSave(draft);
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div
        className={`text-xs font-semibold text-center py-1 rounded ${
          isValid
            ? 'bg-green-900/50 text-green-400'
            : diff > 0
              ? 'bg-red-900/50 text-red-400'
              : 'bg-yellow-900/50 text-yellow-400'
        }`}
      >
        {total}/{playerCount} {t('roomLobby.roles')}
        {!isValid && (diff > 0
          ? ` (${t('roomLobby.rolesExcess', { n: diff })})`
          : ` (${t('roomLobby.rolesShort', { n: Math.abs(diff) })})`)}
      </div>

      {/* Role groups */}
      {ROLE_GROUPS.map((group) => (
        <div key={group.labelKey}>
          <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${group.color}`}>
            {t(group.labelKey)}
          </p>
          <div className="space-y-1">
            {group.roles.map((role) => {
              const count = draft[role] ?? 0;
              const fixed = ROLE_FIXED[role];
              const max = STACKABLE.has(role) ? playerCount : 1;
              return (
                <div key={role} className="flex items-center justify-between">
                  <span className={`text-sm ${count > 0 ? 'text-white' : 'text-gray-500'}`}>
                    {ROLE_ICONS[role] ?? ''} {roleLabel[role] ?? role}
                    {fixed !== undefined && (
                      <span className="ml-1 text-xs text-gray-500">×{fixed}</span>
                    )}
                  </span>
                  {isHost ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjust(role, -1)}
                        disabled={count === 0}
                        className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-xs font-bold"
                      >
                        −
                      </button>
                      <span
                        className={`w-5 text-center text-sm font-mono ${count > 0 ? 'text-white' : 'text-gray-600'}`}
                      >
                        {count}
                      </span>
                      <button
                        onClick={() => adjust(role, 1)}
                        disabled={fixed !== undefined ? count > 0 : count >= max}
                        className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className={`text-sm font-mono ${count > 0 ? 'text-white' : 'text-gray-600'}`}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      {isHost && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleReset}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
          >
            {t('roomLobby.roleReset')}
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {t('roomLobby.roleSave')}
          </button>
        </div>
      )}
    </div>
  );
}
