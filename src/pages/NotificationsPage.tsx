import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { subscribeLiveEvents } from '../services/events';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../services/notifications';

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchNotifications({ limit: 80 });
      setItems(data.notifications);
      setUnread(data.unread);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bildirimler alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const stop = subscribeLiveEvents((ev) => {
      if (ev.type === 'notification' || ev.type === 'audit') void refresh();
    });
    const t = setInterval(() => void refresh(), 10000);
    return () => {
      stop();
      clearInterval(t);
    };
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Bell className="size-6 text-lykia-400" />
            Bildirim Merkezi
            {unread > 0 && (
              <span className="rounded-full bg-lykia-500 px-2 py-0.5 text-xs font-bold text-obsidian-950">
                {unread}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Önemli operasyon olayları — SSE ile canlı yenilenir.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200"
          >
            <RefreshCw className="size-4" />
            Yenile
          </button>
          <button
            type="button"
            onClick={() => void markAllNotificationsRead().then(() => refresh())}
            className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400"
          >
            <CheckCheck className="size-4" />
            Tümünü Okundu
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <PanelCard title="Gelen Kutusu" subtitle={`${items.length} kayıt`}>
        <ul className="space-y-2">
          {items.length === 0 && (
            <li className="text-sm text-slate-600">Bildirim yok.</li>
          )}
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border px-3 py-2.5 ${
                n.read
                  ? 'border-obsidian-700 bg-obsidian-950/40'
                  : 'border-lykia-500/30 bg-lykia-500/5'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-lykia-300">{n.action}</p>
                  <p className="mt-0.5 text-sm text-slate-200">{n.detail}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {n.actor} · {new Date(n.at).toLocaleString('tr-TR')} · {n.level}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => void markNotificationRead(n.id).then(() => refresh())}
                    className="rounded-lg border border-obsidian-700 px-2 py-1 text-[11px] text-slate-300 hover:border-lykia-500/40"
                  >
                    Okundu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
