import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setDisplayName(name.trim());
    navigate('/lobby');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h2 className="text-2xl font-bold mb-2">{t('auth.guestTitle')}</h2>
        <p className="text-gray-400 text-sm mb-6">{t('auth.guestSubtitle')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={t('auth.displayNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500"
            required
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {t('auth.guestButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
