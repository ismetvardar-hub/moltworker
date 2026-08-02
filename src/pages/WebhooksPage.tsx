import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Webhook } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  ackWebhooksFlag,
  createWebhook,
  deleteWebhook,
  fetchWebhooks,
  probeWebhookDelivery,
  runWebhooksSweep,
  seedWebhookHook,
  toggleWebhookActive,
  type Webhook as Wh,
  type WebhookDelivery,
} from '../services/webhooks';

const EVENT_OPTIONS = [
  'pass.admit',
  'pass.deny',
  'archive.save',
  'jobs.failed',
  'guests.create',
  'settings.update',
  '*',
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Wh[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [url, setUrl] = useState('https://example.com/likya-hook');
  const [events, setEvents] = useState<string[]>(['pass.admit', 'archive.save']);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchWebhooks();
      setHooks(data.webhooks);
      setDeliveries(data.deliveries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Webhook hatası');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleEvent = (ev: string) => {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((x) => x !== ev) : [...prev, ev],
    );
  };

  const ping = (message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 2600);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWebhook({ url: url.trim(), events });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Webhook className="size-6 text-lykia-400" />
            Outbound Webhooks
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            pass / arşiv / görev olaylarını dış sisteme POST et (AŞAMA 21)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200"
        >
          <RefreshCw className="size-4" />
          Yenile
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      {flash && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {flash}
        </div>
      )}

      <PanelCard title="Ops toolbar" subtitle="Wave 161">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
            onClick={() =>
              void runWebhooksSweep({ force: true }).then((r: any) => {
                ping(`Sweep +${r.created?.length ?? 0}`);
                return refresh();
              })
            }
          >
            Sweep
          </button>
          <button
            type="button"
            className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
            onClick={() =>
              void ackWebhooksFlag({}).then((r: any) => {
                ping(r.ok ? 'Flag ack' : r.error || 'Ack yok');
                return refresh();
              })
            }
          >
            Flag ack
          </button>
          <button
            type="button"
            className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
            onClick={() =>
              void probeWebhookDelivery({ status: 202 }).then(() => {
                ping('Probe delivery');
                return refresh();
              })
            }
          >
            Probe delivery
          </button>
          <button
            type="button"
            className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100"
            onClick={() =>
              void seedWebhookHook({}).then(() => {
                ping('Seed hook');
                return refresh();
              })
            }
          >
            Seed hook
          </button>
          <button
            type="button"
            className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
            onClick={() =>
              void toggleWebhookActive({ id: hooks[0]?.id }).then((r: any) => {
                ping(r.ok ? 'Toggle active' : r.error || 'Toggle yok');
                return refresh();
              })
            }
          >
            Toggle active
          </button>
        </div>
      </PanelCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Yeni Webhook" subtitle="CEO">
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2.5 font-mono text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
              required
            />
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => toggleEvent(ev)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-[11px] ${
                    events.includes(ev)
                      ? 'bg-lykia-500/20 text-lykia-300'
                      : 'bg-obsidian-950 text-slate-500'
                  }`}
                >
                  {ev}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950"
            >
              <Plus className="size-4" />
              Webhook Ekle
            </button>
          </form>
        </PanelCard>

        <PanelCard title="Kayıtlı Hook&apos;lar" subtitle={`${hooks.length} adet`}>
          <ul className="space-y-2">
            {hooks.length === 0 && (
              <li className="text-sm text-slate-600">Henüz webhook yok.</li>
            )}
            {hooks.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-lykia-300">{h.url}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {(h.events ?? []).join(', ')}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                      secret: {h.secret}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteWebhook(h.id).then(() => refresh())}
                    className="rounded-lg border border-obsidian-700 px-2 py-1 text-slate-400 hover:text-rose-300"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Son Teslimatlar" subtitle="Delivery log" className="xl:col-span-2">
          <ul className="max-h-64 space-y-2 overflow-y-auto font-mono text-xs">
            {deliveries.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <span className="text-slate-600">
                  {new Date(d.at).toLocaleTimeString('tr-TR')}
                </span>{' '}
                <span className="text-lykia-300">{d.event}</span>{' '}
                <span className={d.ok ? 'text-emerald-300' : 'text-rose-300'}>
                  {d.ok ? `HTTP ${d.status}` : d.error || `HTTP ${d.status}`}
                </span>
                <span className="block truncate text-slate-500">{d.url}</span>
              </li>
            ))}
            {deliveries.length === 0 && (
              <li className="font-sans text-sm text-slate-600">Henüz teslimat yok.</li>
            )}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
