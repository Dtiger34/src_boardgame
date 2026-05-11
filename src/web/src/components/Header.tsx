import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';

function LangToggle() {
  const { i18n, t } = useTranslation();
  const next = i18n.language === 'en' ? 'vi' : 'en';
  function toggle() {
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  }
  return (
    <button
      onClick={toggle}
      className="px-2 py-1 text-xs border border-gray-700 hover:border-gray-500 rounded text-gray-400 hover:text-gray-100 transition-colors font-mono"
    >
      {t('langSwitch.label')}
    </button>
  );
}

function UserMenu() {
  const { user, setDisplayName } = useAuthStore();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayed = user?.displayName || user?.username || '';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function openEdit() {
    setValue(user?.displayName || '');
    setEditing(true);
  }

  function save() {
    if (!value.trim()) return;
    setDisplayName(value.trim());
    setEditing(false);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); setEditing(false); }}
        className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </span>
        <span>{displayed}</span>
        <svg className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 z-50">
          {editing ? (
            <div className="px-4 py-3 flex flex-col gap-2">
              <p className="text-xs text-gray-400">{t('header.displayName')}</p>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { save(); }
                  if (e.key === 'Escape') { setEditing(false); }
                }}
                maxLength={50}
                placeholder={user?.username}
                className="w-full bg-gray-800 border border-amber-500 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={!value.trim()}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 text-xs font-semibold rounded-lg transition-colors"
                >
                  {t('header.save')}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-1.5 border border-gray-700 hover:border-gray-500 text-gray-400 text-xs rounded-lg transition-colors"
                >
                  {t('header.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={openEdit}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
              </svg>
              {t('header.changeDisplayName')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  return (
    <header className="fixed top-0 inset-x-0 z-[100] bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-16 grid grid-cols-3 items-center">
        {/* Left: logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">♟</span>
          <span><span className="text-white">Board</span><span className="text-amber-400">Game</span></span>
        </Link>

        {/* Center: nav links */}
        <nav className="flex items-center justify-center gap-6 text-sm">
          <Link to="/#games" className="text-base font-semibold text-white hover:text-amber-400 transition-colors">
            {t('header.games')}
          </Link>
          {user && (
            <Link to="/lobby" className="text-base font-semibold text-white hover:text-amber-400 transition-colors">
              {t('header.lobby')}
            </Link>
          )}
        </nav>

        {/* Right: lang + user */}
        <div className="flex items-center justify-end gap-3 text-sm">
          <LangToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors"
            >
              {t('auth.guestButton')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
