import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GameCatalogEntry } from '@boardgame/types';

function RulesModal({ game, onClose }: { game: GameCatalogEntry; onClose: () => void }) {
  const { t } = useTranslation();
  const sections = game.rules.split(/(?=^## )/m).filter(Boolean);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-amber-400">{game.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-gray-400 text-sm mb-5">{game.description}</p>
        <div className="space-y-4">
          {sections.map((section, i) => {
            const [heading, ...lines] = section.split('\n');
            const title = heading.replace(/^## /, '');
            const body = lines.join('\n').trim();
            return (
              <div key={i}>
                <h3 className="font-semibold text-gray-100 mb-1">{title}</h3>
                <div className="text-gray-400 text-sm whitespace-pre-line">{body}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <Link
            to="/login"
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg text-sm transition-colors"
          >
            {t('home.playNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, onViewRules }: { game: GameCatalogEntry; onViewRules: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 flex flex-col gap-3 transition-colors">
      <h3 className="text-lg font-semibold">{game.name}</h3>
      <p className="text-gray-400 text-sm flex-1">{game.description}</p>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-600">
          {t('home.players', { min: game.minPlayers, max: game.maxPlayers })}
        </span>
        <button
          onClick={onViewRules}
          className="px-4 py-1.5 border border-gray-700 hover:border-amber-500 hover:text-amber-400 rounded-lg text-sm transition-colors"
        >
          {t('home.viewRules')}
        </button>
      </div>
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<GameCatalogEntry | null>(null);

  const { data: games = [] } = useQuery<GameCatalogEntry[]>({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then((r) => r.data.data),
  });

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <section className="flex flex-col items-center justify-center text-center px-4 py-28 gap-5">
        <h1 className="text-5xl font-bold">
          Board<span className="text-amber-400">Game</span> Online
        </h1>
        <Link
          to="/lobby"
          className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors"
        >
          {t('home.playNow')}
        </Link>
      </section>

      {games.length > 0 && (
        <section id="games" className="max-w-3xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold mb-6">{t('home.gameList')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {games.map((g) => (
              <GameCard key={g.gameType} game={g} onViewRules={() => setSelected(g)} />
            ))}
          </div>
        </section>
      )}

      {selected && <RulesModal game={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
