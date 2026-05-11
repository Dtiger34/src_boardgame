import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/game';

export function ChatBox({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const messages = useGameStore((s) => s.messages);
  const sendChat = useGameStore((s) => s.sendChat);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendChat(roomId, input.trim());
    setInput('');
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col flex-1">
      <h3 className="font-medium mb-3 text-sm text-gray-400">{t('chat.title')}</h3>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 mb-3 max-h-48 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="text-amber-400 font-medium">{msg.username}: </span>
            <span className="text-gray-300">{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.placeholder')}
          maxLength={500}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded text-xs font-semibold"
        >
          {t('chat.send')}
        </button>
      </form>
    </div>
  );
}
