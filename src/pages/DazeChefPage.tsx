import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ListChecks,
  MessageCircle,
  PackageCheck,
  Snowflake,
  Terminal,
  Timer,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  buildReadyMessage,
  buildThermalMessage,
  sendWhatsApp,
  type WhatsAppResult,
} from '../services/whatsapp';

/** Daze-Reminder kuralı: hazır ürün 120 saniye içinde teslim alınmalıdır. */
const PICKUP_LIMIT_SECONDS = 120;

type OrderStatus = 'hazirlaniyor' | 'hazir' | 'korumada' | 'teslim';

interface KitchenOrder {
  id: number;
  item: string;
  guest: string;
  phone: string;
  status: OrderStatus;
  remaining: number;
}

interface RecipeStep {
  label: string;
  done: boolean;
}

const INITIAL_ORDERS: KitchenOrder[] = [
  {
    id: 101,
    item: 'Izgara Köfte Menü',
    guest: 'Elif K.',
    phone: '+905551010101',
    status: 'hazir',
    remaining: PICKUP_LIMIT_SECONDS,
  },
  {
    id: 102,
    item: 'Gözleme + Ayran',
    guest: 'Mert D.',
    phone: '+905551010102',
    status: 'hazir',
    remaining: 74,
  },
  {
    id: 103,
    item: 'Serpme Kahvaltı',
    guest: 'Zeynep A.',
    phone: '+905551010103',
    status: 'hazirlaniyor',
    remaining: 0,
  },
];

const INITIAL_RECIPE: RecipeStep[] = [
  { label: 'Köfte harcını porsiyonla (180 g)', done: true },
  { label: 'Izgarayı 230°C\u2019ye getir', done: true },
  { label: 'Köfteleri 4+4 dk çevirerek pişir', done: false },
  { label: 'Garnitür tabağını hazırla', done: false },
  { label: 'HEPHAESTUS stok düşüşünü onayla', done: false },
];

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  hazirlaniyor: { label: 'Hazırlanıyor', cls: 'bg-sky-500/15 text-sky-300' },
  hazir: { label: 'Teslime Hazır', cls: 'bg-emerald-500/15 text-emerald-300' },
  korumada: { label: 'Termal Korumada', cls: 'bg-amber-500/15 text-amber-300' },
  teslim: { label: 'Teslim Edildi', cls: 'bg-slate-500/15 text-slate-400' },
};

const STOCK_EVENTS = [
  '[HEPHAESTUS] köfte harcı -2 porsiyon → stok %66',
  '[HEPHAESTUS] ayran -3 adet → stok %81',
  '[HEPHAESTUS] gözleme hamuru -1 porsiyon → stok %54',
  '[HEPHAESTUS] domates -0.4 kg → stok %72',
  '[HEPHAESTUS] köfte harcı -2 porsiyon → stok %61',
  '[HEPHAESTUS] kaşar -0.2 kg → stok %47',
  '[HEPHAESTUS] ⚠ gözleme hamuru kritik eşiğe yaklaşıyor (%38)',
  '[HEPHAESTUS] kritik seviye! → AGORA re-order sinyali çekildi ✓',
  '[AGORA] tedarikçi teklifi alındı: yarın 07:00 teslimat 🚚',
  '[HEPHAESTUS] stok senkronizasyonu DAZE-HUB ile tamamlandı ✓',
];

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function StockTerminal() {
  const [lines, setLines] = useState<string[]>([STOCK_EVENTS[0]]);
  const idxRef = useRef(1);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, STOCK_EVENTS[idxRef.current % STOCK_EVENTS.length]];
        idxRef.current += 1;
        return next.length > 12 ? next.slice(next.length - 12) : next;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  return (
    <div className="flex h-72 flex-col overflow-hidden rounded-xl border border-obsidian-700 bg-black/60">
      <div className="flex items-center gap-2 border-b border-obsidian-700 bg-obsidian-900 px-4 py-2.5">
        <Terminal className="size-4 text-lykia-400" />
        <span className="font-mono text-xs text-slate-400">hephaestus — canlı stok düşüşü</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          CANLI
        </span>
      </div>
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-6">
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              line.includes('⚠') || line.includes('kritik')
                ? 'text-amber-300'
                : line.startsWith('[AGORA]')
                  ? 'text-sky-300'
                  : 'text-emerald-200/90'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function DazeChefPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>(INITIAL_ORDERS);
  const [recipe, setRecipe] = useState<RecipeStep[]>(INITIAL_RECIPE);
  const [waLog, setWaLog] = useState<WhatsAppResult[]>([]);
  const thermalSent = useRef<Set<number>>(new Set());
  const readySent = useRef<Set<number>>(new Set());

  const notify = async (
    order: KitchenOrder,
    kind: 'ready' | 'thermal',
  ): Promise<void> => {
    const body =
      kind === 'ready'
        ? buildReadyMessage(order.guest, order.item, order.id)
        : buildThermalMessage(order.guest, order.item, order.id);
    try {
      const result = await sendWhatsApp({
        to: order.phone,
        body,
        guest: order.guest,
        orderId: order.id,
        kind,
      });
      setWaLog((prev) => [result, ...prev].slice(0, 12));
    } catch (err) {
      setWaLog((prev) => [
        {
          ok: false,
          live: false,
          id: `err_${Date.now()}`,
          provider: 'error',
          status: 'failed',
          body,
          to: order.phone,
          guest: order.guest,
          orderId: order.id,
          kind,
          note: err instanceof Error ? err.message : 'Gönderim hatası',
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 12));
    }
  };

  // 120 sn geri sayım + termal korumada REMINDER-AI WhatsApp.
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.status !== 'hazir') return o;
          if (o.remaining <= 1) {
            if (!thermalSent.current.has(o.id)) {
              thermalSent.current.add(o.id);
              void notify(o, 'thermal');
            }
            return { ...o, status: 'korumada' as const, remaining: 0 };
          }
          return { ...o, remaining: o.remaining - 1 };
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // İlk yüklemede hazır siparişler için "hazır" bildirimi (bir kez).
  useEffect(() => {
    for (const o of INITIAL_ORDERS) {
      if (o.status === 'hazir' && !readySent.current.has(o.id)) {
        readySent.current.add(o.id);
        void notify(o, 'ready');
      }
    }
  }, []);

  const deliver = (id: number) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'teslim' } : o)));
  };

  const markReady = (id: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const updated = { ...o, status: 'hazir' as const, remaining: PICKUP_LIMIT_SECONDS };
        if (!readySent.current.has(id)) {
          readySent.current.add(id);
          void notify(updated, 'ready');
        }
        return updated;
      }),
    );
  };

  const toggleStep = (index: number) => {
    setRecipe((prev) => prev.map((s, i) => (i === index ? { ...s, done: !s.done } : s)));
  };

  const doneSteps = recipe.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <ChefHat className="size-6 text-lykia-400" />
          Daze Chef — Mutfak Paneli
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          2 dk kuralı, reçete adımları, HEPHAESTUS stok ve REMINDER-AI WhatsApp bildirimleri.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard
          title="Sipariş Teslim Sayaçları"
          subtitle={`Daze-Reminder: ${PICKUP_LIMIT_SECONDS} sn içinde alınmazsa termal koruma + WhatsApp`}
          className="xl:col-span-2"
        >
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {orders.map((order) => {
              const meta = STATUS_META[order.status];
              const urgent = order.status === 'hazir' && order.remaining <= 30;
              return (
                <li
                  key={order.id}
                  className={`rounded-xl border p-4 ${
                    urgent
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : order.status === 'korumada'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-obsidian-700 bg-obsidian-950/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{order.item}</p>
                      <p className="text-xs text-slate-500">
                        #{order.id} · {order.guest} · {order.phone}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {order.status === 'hazir' && (
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-2 font-mono text-2xl font-bold ${
                          urgent ? 'text-rose-300' : 'text-emerald-300'
                        }`}
                      >
                        <Timer className="size-5" />
                        {formatCountdown(order.remaining)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deliver(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-lykia-500 px-3 py-1.5 text-xs font-semibold text-obsidian-950 transition hover:bg-lykia-400"
                      >
                        <PackageCheck className="size-4" />
                        Teslim Al
                      </button>
                    </div>
                  )}

                  {order.status === 'korumada' && (
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-xs text-amber-300">
                        <Snowflake className="size-4" />
                        Termal korumada · REMINDER-AI WhatsApp gönderildi
                      </p>
                      <button
                        type="button"
                        onClick={() => deliver(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
                      >
                        <PackageCheck className="size-4" />
                        Korumadan Teslim Et
                      </button>
                    </div>
                  )}

                  {order.status === 'hazirlaniyor' && (
                    <button
                      type="button"
                      onClick={() => markReady(order.id)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="size-4" />
                      Hazır — Sayaç + WhatsApp
                    </button>
                  )}

                  {order.status === 'teslim' && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Misafire ulaştı. Afiyet olsun!
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </PanelCard>

        <PanelCard
          title="Aktif Reçete Adımları"
          subtitle="Izgara Köfte Menü · #101"
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-300">
              <ListChecks className="size-3.5" />
              {doneSteps}/{recipe.length}
            </span>
          }
        >
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-obsidian-700">
            <div
              className="h-full rounded-full bg-lykia-500 transition-all"
              style={{ width: `${(doneSteps / recipe.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2">
            {recipe.map((step, i) => (
              <li key={step.label}>
                <button
                  type="button"
                  onClick={() => toggleStep(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    step.done
                      ? 'border-emerald-500/25 bg-emerald-500/5 text-slate-400 line-through'
                      : 'border-obsidian-700 bg-obsidian-950/60 text-slate-200 hover:border-lykia-500/40'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-slate-600" />
                  )}
                  {step.label}
                </button>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard
          title="HEPHAESTUS — Canlı Stok Düşüş Terminali"
          subtitle="Kritik seviyede AGORA re-order sinyali"
        >
          <StockTerminal />
        </PanelCard>

        <PanelCard
          title="REMINDER-AI — WhatsApp Bildirimleri"
          subtitle="Twilio / Meta Graph canlı · anahtar yoksa mock simülasyon"
          actions={
            <span className="rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-300">
              <MessageCircle className="mr-1 inline size-3.5" />
              {waLog.length} mesaj
            </span>
          }
        >
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {waLog.length === 0 && (
              <li className="rounded-xl border border-dashed border-obsidian-700 p-4 text-center text-xs text-slate-600">
                Henüz bildirim yok. Sayaç başlatıldığında veya termal korumaya geçildiğinde
                REMINDER-AI mesaj gönderir.
              </li>
            )}
            {waLog.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {m.guest ?? m.to} · #{m.orderId}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      m.live
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {m.provider}/{m.status}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{m.body}</p>
                {m.note && <p className="mt-1 text-[10px] text-slate-600">{m.note}</p>}
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
