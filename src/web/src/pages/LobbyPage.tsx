import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import type { GameCatalogEntry, GameRoom } from '@boardgame/types';

type Tab = 'create' | 'join-code' | 'public';

export function LobbyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('public');
  const [gameType, setGameType] = useState('gomoku');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: catalog = [] } = useQuery<GameCatalogEntry[]>({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then((r) => r.data.data),
  });

  useEffect(() => {
    if (catalog.length === 0) return;
    if (!catalog.some((g) => g.gameType === gameType)) {
      setGameType(catalog[0].gameType);
    }
  }, [catalog, gameType]);

  const { data: publicRooms = [], refetch: refetchRooms } = useQuery<GameRoom[]>({
    queryKey: ['rooms:public'],
    queryFn: () => api.get('/games/rooms').then((r) => r.data.data),
    refetchInterval: 5000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: tab === 'public',
  });

  useEffect(() => {
    if (tab !== 'public') return;
    queryClient.removeQueries({ queryKey: ['rooms:public'] });
    refetchRooms();
  }, [tab, queryClient, refetchRooms]);

  if (!user) return null;

  async function enterRoom(roomId: string) {
    navigate(`/game/${roomId}`);
  }

  async function createRoom() {
    if (!catalog.some((g) => g.gameType === gameType)) {
      setError(t('lobby.errCreate'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/games/rooms', { gameType, isPrivate: false });
      await enterRoom(data.data.id);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; message?: string } } };
      const errCode = err.response?.data?.error;
      if (errCode === 'UNAUTHORIZED') setError(t('lobby.errJoin'));
      else if (errCode === 'UNKNOWN_GAME_TYPE') setError(t('lobby.errCreate'));
      else setError(err.response?.data?.message || t('lobby.errCreate'));
    } finally {
      setLoading(false);
    }
  }

  async function joinByCode() {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/games/rooms/join-by-code', { inviteCode: code.trim() });
      await enterRoom(data.data.id);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      const errCode = err.response?.data?.error;
      if (errCode === 'INVALID_CODE') setError(t('lobby.errInvalidCode'));
      else if (errCode === 'ROOM_FULL') setError(t('lobby.errRoomFull'));
      else if (errCode === 'ROOM_NOT_OPEN') setError(t('lobby.errRoomNotOpen'));
      else setError(t('lobby.errJoin'));
    } finally {
      setLoading(false);
    }
  }

  async function joinPublicRoom(roomId: string) {
    setError('');
    setLoading(true);
    try {
      await api.post(`/games/rooms/${roomId}/join`);
      await enterRoom(roomId);
    } catch {
      setError(t('lobby.errJoin'));
      refetchRooms();
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'public', label: t('lobby.tabPublic') },
    { id: 'join-code', label: t('lobby.tabJoinCode') },
    { id: 'create', label: t('lobby.tabCreate') },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">{t('lobby.title')}</h1>
        </header>

        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
          {tabs.map((tab_) => (
            <button
              key={tab_.id}
              onClick={() => { setTab(tab_.id); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === tab_.id ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab_.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {tab === 'public' && (
          <div className="space-y-3">
            {publicRooms.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-4xl mb-3">🎲</p>
                <p>{t('lobby.noRooms')}</p>
                <button
                  onClick={() => setTab('create')}
                  className="mt-4 text-amber-400 hover:text-amber-300 text-sm underline"
                >
                  {t('lobby.createOne')}
                </button>
              </div>
            ) : (
              publicRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {catalog.find((g) => g.gameType === room.gameType)?.name ?? room.gameType}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {room.players[0]?.username} • {t('lobby.code')}: <span className="font-mono text-gray-400">{room.inviteCode}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => joinPublicRoom(room.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold rounded-lg text-sm transition-colors"
                  >
                    {t('lobby.join')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'join-code' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-gray-400 text-sm">{t('lobby.codeHint')}</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinByCode()}
              placeholder={t('lobby.codePlaceholder')}
              maxLength={8}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              onClick={joinByCode}
              disabled={loading || code.length < 6}
              className="py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold rounded-lg transition-colors"
            >
              {loading ? t('lobby.joining') : t('lobby.joinRoom')}
            </button>
          </div>
        )}

        {tab === 'create' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('lobby.selectGame')}</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
              >
                {catalog.map((g) => (
                  <option key={g.gameType} value={g.gameType}>{g.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={createRoom}
              disabled={loading}
              className="py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-semibold rounded-lg transition-colors"
            >
              {loading ? t('lobby.creating') : t('lobby.createRoom')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
