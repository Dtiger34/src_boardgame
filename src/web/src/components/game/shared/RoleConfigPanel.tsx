import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_ICONS } from '@/components/game/werewolf/constants';

interface Props {
  playerCount: number;
  customRoles: Record<string, number> | undefined;
  isHost: boolean;
  roleLabel: Record<string, string>;
  onSave: (roles: Record<string, number>) => void;
}

type RoleGroup = { label: string; color: string; roles: string[] };

const ROLE_GROUPS: RoleGroup[] = [
  {
    label: 'Làng',
    color: 'text-green-400',
    roles: [
      'villager',
      'seer',
      'guard',
      'hunter',
      'witch',
      'sheriff',
      'cupid',
      'little_girl',
      'two_sisters',
      'three_brothers',
      'stuttering_judge',
      'rusty_knight',
      'devoted_servant',
      'wild_child',
      'fool',
      'drunk',
      'elder',
    ],
  },
  {
    label: 'Sói',
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
    label: 'Trung lập',
    color: 'text-yellow-400',
    roles: ['suicidal', 'white_wolf', 'angel', 'thief', 'cursed', 'avenger', 'impersonator'],
  },
];

// Roles that can appear more than once
const STACKABLE = new Set(['villager', 'werewolf']);

function buildDefaultFromCount(playerCount: number): Record<string, number> {
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

export function RoleConfigPanel({ playerCount, customRoles, isHost, roleLabel, onSave }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Record<string, number>>(
    () => customRoles ?? buildDefaultFromCount(playerCount),
  );
  const [open, setOpen] = useState(false);
  const prevCustomRolesRef = useRef(customRoles);

  // Sync draft when server confirms new customRoles (after save or reset)
  useEffect(() => {
    if (customRoles !== prevCustomRolesRef.current) {
      prevCustomRolesRef.current = customRoles;
      setDraft(customRoles ?? buildDefaultFromCount(playerCount));
    }
  }, [customRoles, playerCount]);

  // When playerCount changes, adjust villager count to keep draft valid
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
      const max = STACKABLE.has(role) ? playerCount : 1;
      const val = Math.max(0, Math.min(max, cur + delta));
      if (val === 0) delete next[role];
      else next[role] = val;
      return next;
    });
  }

  function handleReset() {
    setDraft(buildDefaultFromCount(playerCount));
  }

  function handleSave() {
    onSave(draft);
    setOpen(false);
  }

  // Summary chips shown when panel is closed
  const activeSummary = Object.entries(customRoles ?? {})
    .filter(([, n]) => n > 0)
    .slice(0, 6);

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-750 transition"
      >
        <span className="text-sm font-semibold text-gray-200">
          {t('roomLobby.roleConfig', 'Cấu hình vai trò')}
        </span>
        <div className="flex items-center gap-2">
          {!open && activeSummary.length > 0 && (
            <span className="text-xs text-gray-400">
              {activeSummary
                .map(([r, n]) => `${ROLE_ICONS[r] ?? ''}${n > 1 ? `×${n}` : ''}`)
                .join(' ')}
              {Object.keys(customRoles ?? {}).length > 6 ? ' …' : ''}
            </span>
          )}
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
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
            {total}/{playerCount} vai trò
            {!isValid && (diff > 0 ? ` (thừa ${diff})` : ` (thiếu ${Math.abs(diff)})`)}
          </div>

          {/* Role groups */}
          {ROLE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${group.color}`}>
                {group.label}
              </p>
              <div className="space-y-1">
                {group.roles.map((role) => {
                  const count = draft[role] ?? 0;
                  const max = STACKABLE.has(role) ? playerCount : 1;
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <span className={`text-sm ${count > 0 ? 'text-white' : 'text-gray-500'}`}>
                        {ROLE_ICONS[role] ?? ''} {roleLabel[role] ?? role}
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
                            disabled={count >= max}
                            className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-sm font-mono ${count > 0 ? 'text-white' : 'text-gray-600'}`}
                        >
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
                {t('roomLobby.roleReset', 'Tự động')}
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {t('roomLobby.roleSave', 'Lưu')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
