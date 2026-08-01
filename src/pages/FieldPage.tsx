import { useCallback, useEffect, useState } from 'react';
import {
  ChefHat,
  CloudOff,
  MessageCircle,
  RefreshCw,
  UploadCloud,
  Users,
  Wifi,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  buildReadyMessage,
  buildThermalMessage,
  sendWhatsApp,
} from '../services/whatsapp';
import {
  enqueueOffline,
  flushOfflineQueue,
  isOnline,
  listOfflineJobs,
  type OfflineJob,
} from '../services/offlineQueue';

type OrderStatus = 'hazirlaniyor' | 'hazir' | 'korumada' | 'teslim';

interface FieldOrder {
  id: number;
  item: string;
  guest: string;
  phone: string;
  status: OrderStatus;
}

interface FieldTask {
  id: number;
  label: string;
  zone: string;
  done: boolean;
}

const SEED_ORDERS: FieldOrder[] = [
  {
    id: 201,
    item: 'Izgara Köfte Menü',
    guest: 'Elif K.',
    phone: '+905551010101',
    status: 'hazir',
  },
  {
    id: 202,
    item: 'Gözleme + Ayran',
    guest: 'Mert D.',
    phone: '+905551010102',
    status: 'hazir',
  },
  {
    id: 203,
    item: 'Serpme Kahvaltı',
    guest: 'Zeynep A.',
    phone: '+905551010103',
    status: 'hazirlaniyor',
  },
];

const SEED_TASKS: FieldTask[] = [
  { id: 1, label: 'VIP Salon servis hazırlığı', zone: 'VIP', done: false },
  { id: 2, label: 'Plaj turnike kontrolü', zone: 'Plaj', done: false },
  { id: 3, label: 'Termal ünite kontrol', zone: 'Mutfak', done: true },
];

export default function FieldPage() {
  const [orders, setOrders] = useState<FieldOrder[]>(SEED_ORDERS);
  const [tasks, setTasks] = useState<FieldTask[]>(SEED_TASKS);
  const [online, setOnline] = useState(isOnline());
  const [queue, setQueue] = useState<OfflineJob[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const refreshQueue = useCallback(() => {
    setQueue(listOfflineJobs());
  }, []);

  useEffect(() => {
    refreshQueue();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [refreshQueue]);

  const pushWa = async (
    order: FieldOrder,
    kind: 'ready' | 'thermal',
  ) => {
    const body =
      kind === 'ready'
        ? buildReadyMessage(order.guest, order.item, order.id)
        : buildThermalMessage(order.guest, order.item, order.id);
    const payload = {
      to: order.phone,
      body,
      guest: order.guest,
      orderId: order.id,
      kind,
    };
    if (!isOnline()) {
      enqueueOffline({ kind: 'whatsapp', payload });
      setNote('Çevrimdışı — WhatsApp kuyruğa alındı');
      refreshQueue();
      return;
    }
    try {
      await sendWhatsApp(payload);
      setNote(`WhatsApp gönderildi (${kind}) → ${order.guest}`);
    } catch {
      enqueueOffline({ kind: 'whatsapp', payload });
      setNote('Gönderim başarısız — offline kuyruğa alındı');
      refreshQueue();
    }
  };

  const markReady = (id: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'hazir' } : o)),
    );
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      const t = next.find((x) => x.id === id);
      if (t && !isOnline()) {
        enqueueOffline({
          kind: 'crew-task',
          payload: { taskId: t.id, done: t.done, label: t.label },
        });
        refreshQueue();
      }
      return next;
    });
  };

  const flush = async () => {
    const r = await flushOfflineQueue();
    setNote(`Flush: ${r.sent} gönderildi · ${r.failed} hata · ${r.remaining} kaldı`);
    refreshQueue();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Saha Modu</h1>
          <p className="mt-1 text-sm text-slate-400">
            Tablet odaklı mutfak / crew · büyük dokunuş · offline kuyruk (AŞAMA 14)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
              online
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {online ? <Wifi className="size-4" /> : <CloudOff className="size-4" />}
            {online ? 'Çevrimiçi' : 'Çevrimdışı'}
          </span>
          <button
            type="button"
            onClick={() => void flush()}
            className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950"
          >
            <UploadCloud className="size-4" />
            Kuyruğu Gönder ({queue.length})
          </button>
        </div>
      </div>

      {note && (
        <div className="rounded-xl border border-lykia-500/30 bg-lykia-500/10 px-4 py-3 text-sm text-lykia-200">
          {note}
        </div>
      )}

      <PanelCard
        title="Mutfak — Hızlı Sipariş"
        subtitle="Hazır / WhatsApp / Termal"
        actions={<ChefHat className="size-5 text-lykia-400" />}
      >
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-obsidian-700 bg-obsidian-950/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-slate-50">{o.item}</p>
                  <p className="text-sm text-slate-400">
                    {o.guest} · {o.phone}
                  </p>
                  <p className="mt-1 font-mono text-xs text-lykia-300">#{o.id} · {o.status}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => markReady(o.id)}
                  className="rounded-2xl border border-obsidian-600 py-4 text-base font-semibold text-slate-100 active:bg-obsidian-800"
                >
                  Hazır
                </button>
                <button
                  type="button"
                  onClick={() => void pushWa(o, 'ready')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 py-4 text-base font-semibold text-obsidian-950 active:opacity-90"
                >
                  <MessageCircle className="size-5" />
                  WA Hazır
                </button>
                <button
                  type="button"
                  onClick={() => void pushWa(o, 'thermal')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500/90 py-4 text-base font-semibold text-obsidian-950 active:opacity-90"
                >
                  WA Termal
                </button>
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>

      <PanelCard
        title="Crew — Görevler"
        subtitle="Dokunarak tamamla"
        actions={<Users className="size-5 text-lykia-400" />}
      >
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => toggleTask(t.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-5 text-left text-base font-semibold transition ${
                  t.done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-obsidian-700 bg-obsidian-950 text-slate-100'
                }`}
              >
                <span>
                  {t.label}
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {t.zone}
                  </span>
                </span>
                <span className="text-sm">{t.done ? '✓' : '○'}</span>
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>

      <PanelCard
        title="Offline Kuyruk"
        subtitle="Ağ gelince flush"
        actions={
          <button
            type="button"
            onClick={refreshQueue}
            className="inline-flex items-center gap-1 text-xs text-slate-400"
          >
            <RefreshCw className="size-3.5" />
            Yenile
          </button>
        }
      >
        <ul className="space-y-2 font-mono text-xs">
          {queue.length === 0 && (
            <li className="font-sans text-sm text-slate-600">Kuyruk boş.</li>
          )}
          {queue.map((j) => (
            <li
              key={j.id}
              className="rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
            >
              {j.kind} · {new Date(j.createdAt).toLocaleTimeString('tr-TR')}
              {j.kind === 'whatsapp' && (
                <span className="block truncate text-slate-400">{j.payload.body}</span>
              )}
              {j.kind === 'crew-task' && (
                <span className="block text-slate-400">{j.payload.label}</span>
              )}
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
