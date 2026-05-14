import { useTranslation } from 'react-i18next';
import { ROLE_ICONS, ROLE_CARD_STYLES } from '../constants';

interface RolesInRoomProps {
  roleCounts: Partial<Record<string, number>> | undefined;
  roleLabel: Record<string, string>;
}

export function RolesInRoom({ roleCounts, roleLabel }: RolesInRoomProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {t('werewolf.rolesInGame')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(roleCounts ?? {}).map(([role, count]) => (
          <div
            key={role}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${ROLE_CARD_STYLES[role] ?? 'bg-gray-800 border-gray-700 text-gray-300'}`}
          >
            <span className="text-base leading-none">{ROLE_ICONS[role] ?? '❓'}</span>
            <span className="text-white">{roleLabel[role] ?? role}</span>
            {(count ?? 0) > 1 && <span className="text-gray-400">×{count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
