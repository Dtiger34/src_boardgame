import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      setUser(data.data.user);
      navigate('/lobby');
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message ?? t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h2 className="text-2xl font-bold mb-6">{t('auth.registerTitle')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={t('auth.usernamePlaceholder')}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500"
            minLength={3}
            required
          />
          <input
            type="password"
            placeholder={t('auth.passwordHint')}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500"
            minLength={8}
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? t('auth.registering') : t('auth.registerButton')}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400 text-sm">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-amber-400 hover:underline">{t('auth.goLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
