import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';

export function WolfChatBox({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const wolfMessages = useGameStore((s) => s.wolfMessages);
  const sendWolfChat = useGameStore((s) => s.sendWolfChat);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [wolfMessages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendWolfChat(roomId, input.trim());
    setInput('');
  }

  return (
    <div className="bg-red-950 border border-red-800 rounded-2xl p-4 flex flex-col">
      <h3 className="font-medium mb-3 text-sm text-red-400 flex items-center gap-1.5">
        🐺 {t('werewolf.wolfChat')}
      </h3>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 mb-3 max-h-40 min-h-0">
        {wolfMessages.length === 0 && (
          <p className="text-xs text-red-700 italic">{t('werewolf.wolfChatEmpty')}</p>
        )}
        {wolfMessages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="text-red-300 font-medium">{msg.username}: </span>
            <span className="text-red-100">{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('werewolf.wolfChatPlaceholder')}
          maxLength={500}
          className="flex-1 bg-red-900 border border-red-700 rounded px-3 py-1.5 text-xs text-red-100 placeholder-red-600 focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
        >
          {t('chat.send')}
        </button>
      </form>
    </div>
  );
}
