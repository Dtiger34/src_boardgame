import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import { api } from '@/lib/api';

const GAME_TYPES = [
  { id: 'gomoku', label: 'Cờ Caro', description: '15×15, 5 quân liên tiếp', emoji: '⬛' },
];

export function LobbyPage() {
  const navigate = useNavigate();
  const { tokens, user, logout } = useAuthStore();
  const { connect } = useSocketStore();
  const [matchmaking, setMatchmaking] = useState<string | null>(null);

  if (!tokens) return null;

  async function joinMatchmaking(gameType: string) {
    connect(tokens!.accessToken);
    setMatchmaking(gameType);
    await api.post('/matchmaking/join', { gameType }).catch(() => setMatchmaking(null));
  }

  async function leaveMatchmaking() {
    await api.delete('/matchmaking/leave').catch(() => {});
    setMatchmaking(null);
  }

  async function createRoom(gameType: string) {
    const { data } = await api.post('/games/rooms', { gameType, isPrivate: true });
    navigate(`/game/${data.data.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Lobby</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user?.username}</p>
              <p className="text-amber-400 text-sm">ELO {user?.rating}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-gray-200 text-sm underline">
              Đăng xuất
            </button>
          </div>
        </header>

        {matchmaking ? (
          <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <p className="text-xl font-medium mb-2">Đang tìm đối thủ...</p>
            <p className="text-gray-400 mb-6">{GAME_TYPES.find((g) => g.id === matchmaking)?.label}</p>
            <button onClick={leaveMatchmaking} className="text-red-400 hover:text-red-300 underline text-sm">
              Hủy
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {GAME_TYPES.map((game) => (
              <div key={game.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{game.emoji}</span>
                  <div>
                    <h2 className="text-xl font-semibold">{game.label}</h2>
                    <p className="text-gray-400 text-sm">{game.description}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => createRoom(game.id)}
                    className="px-4 py-2 border border-gray-700 hover:border-gray-500 rounded-lg text-sm transition-colors"
                  >
                    Tạo phòng
                  </button>
                  <button
                    onClick={() => joinMatchmaking(game.id)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg text-sm transition-colors"
                  >
                    Xếp hàng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
