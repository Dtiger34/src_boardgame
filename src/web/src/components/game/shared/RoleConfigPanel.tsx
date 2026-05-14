import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_ICONS } from '@/components/game/werewolf/constants';
import { RoleEditor } from './RoleEditor';

interface Props {
  playerCount: number;
  customRoles: Record<string, number> | undefined;
  isHost: boolean;
  roleLabel: Record<string, string>;
  onSave: (roles: Record<string, number>) => void;
}

export function RoleConfigPanel({ playerCount, customRoles, isHost, roleLabel, onSave }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const activeSummary = Object.entries(customRoles ?? {})
    .filter(([, n]) => n > 0)
    .slice(0, 6);

  function handleSave(roles: Record<string, number>) {
    onSave(roles);
    setOpen(false);
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-750 transition"
      >
        <span className="text-sm font-semibold text-gray-200">
          {t('roomLobby.roleConfig')}
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
        <div className="px-4 pb-4">
          <RoleEditor
            playerCount={playerCount}
            customRoles={customRoles}
            isHost={isHost}
            roleLabel={roleLabel}
            onSave={handleSave}
            onReset={() => {}}
          />
        </div>
      )}
    </div>
  );
}
