import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { subscribeLiveEvents, type LiveEvent } from '../services/events';

const MAX = 40;

export default function LiveFeed({ title = 'Canlı Olay Akışı' }: { title?: string }) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(true);
    const stop = subscribeLiveEvents((ev) => {
      if (ev.type === 'sse.connected') {
        setConnected(true);
        return;
      }
      setEvents((prev) => [ev, ...prev].slice(0, MAX));
    });
    return () => {
      stop();
      setConnected(false);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-obsidian-700 bg-obsidian-900/80">
      <header className="flex items-center justify-between border-b border-obsidian-700 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <Radio className={`size-4 ${connected ? 'text-emerald-400' : 'text-slate-600'}`} />
          {title}
        </h2>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            connected ? 'text-emerald-400' : 'text-slate-600'
          }`}
        >
          {connected ? 'SSE canlı' : 'bağlantı yok'}
        </span>
      </header>
      <ul className="max-h-64 space-y-1.5 overflow-y-auto p-3 font-mono text-[11px]">
        {events.length === 0 && (
          <li className="px-2 py-3 font-sans text-sm text-slate-600">
            Olay bekleniyor — login, arşiv, WhatsApp, NEXUS veya görevler burada akar.
          </li>
        )}
        {events.map((e, i) => (
          <li
            key={`${e.id ?? e.at}-${i}`}
            className="rounded-lg border border-obsidian-700/80 bg-obsidian-950/50 px-2.5 py-1.5"
          >
            <span className="text-slate-600">
              {new Date(e.at).toLocaleTimeString('tr-TR')}
            </span>{' '}
            <span className="text-sky-300">{e.actor ?? 'system'}</span>{' '}
            <span className="text-lykia-300">{e.action ?? e.type}</span>
            {e.detail && (
              <span className="block truncate font-sans text-[11px] text-slate-400">
                {e.detail}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
