import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Cpu,
  ListTodo,
  MessageCircle,
  Network,
  RefreshCw,
  ScrollText,
  Settings2,
  Sparkles,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { AGENTS, DEPARTMENTS } from '../data/agents';
import { fetchHubSummary, type HubSummary } from '../services/hub';

export default function DazeHubPage() {
  const [summary, setSummary] = useState<HubSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSummary(await fetchHubSummary());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hub özeti alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const hitMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of summary?.agentHits ?? []) m.set(h.agent, h.count);
    return m;
  }, [summary]);

  const fleet = useMemo(() => {
    return AGENTS.map((a) => {
      const hits = hitMap.get(a.name) ?? 0;
      return {
        ...a,
        hits,
        live: hits > 0 ? ('aktif' as const) : a.state,
      };
    });
  }, [hitMap]);

  const activeCount = fleet.filter((a) => a.live === 'aktif').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Network className="size-6 text-lykia-400" />
            Daze Hub — Merkezi Operasyon Beyni
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Arşiv, WhatsApp, NEXUS, audit ve ajan filosunun tek ekranda özeti.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-lykia-500/40 hover:text-lykia-300"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          {
            label: 'Zincir Arşivi',
            value: summary?.archiveCount ?? '—',
            icon: Archive,
            detail: 'Kalıcı görev kayıtları',
          },
          {
            label: 'WhatsApp',
            value: summary?.whatsappCount ?? '—',
            icon: MessageCircle,
            detail: 'REMINDER-AI bildirimleri',
          },
          {
            label: 'NEXUS Olayları',
            value: summary?.nexusEventCount ?? '—',
            icon: Cpu,
            detail: 'IoT protokol günlüğü',
          },
          {
            label: 'Görev Kuyruğu',
            value: summary?.jobsTotal ?? '—',
            icon: ListTodo,
            detail: `${summary?.jobsByStatus?.scheduled ?? 0} zamanlanmış`,
          },
          {
            label: 'Audit',
            value: summary?.auditCount ?? '—',
            icon: ScrollText,
            detail: 'Operasyon izleri',
          },
          {
            label: 'Ayarlar',
            value:
              summary != null
                ? `${summary.settingsConfigured}/${summary.settingsTotal}`
                : '—',
            icon: Settings2,
            detail: 'Yapılandırılmış anahtarlar',
          },
        ].map(({ label, value, icon: Icon, detail }) => (
          <PanelCard key={label} className="!p-0">
            <div className="flex size-10 items-center justify-center rounded-lg bg-lykia-500/10 text-lykia-400">
              <Icon className="size-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-50">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-300">{label}</p>
            <p className="text-xs text-slate-500">{detail}</p>
          </PanelCard>
        ))}
      </div>

      <PanelCard
        title="Canlı Ajan Filosu"
        subtitle={`${activeCount} aktif iz · ${AGENTS.length} ajan · ${DEPARTMENTS.length} departman`}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-lykia-300">{a.name}</p>
                <p className="truncate text-[11px] text-slate-500">{a.role}</p>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    a.live === 'aktif'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : a.live === 'hata'
                        ? 'bg-rose-500/15 text-rose-300'
                        : 'bg-slate-500/15 text-slate-400'
                  }`}
                >
                  {a.live}
                </span>
                {a.hits > 0 && (
                  <p className="mt-1 text-[10px] text-slate-600">{a.hits} görev</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Yaklaşan / Hazır Görevler" subtitle="AŞAMA 6 kuyruk">
          <ul className="space-y-2">
            {[
              ...(summary?.readyDirectives ?? []).map((j) => ({ ...j, tag: 'hazır' })),
              ...(summary?.upcomingJobs ?? []).map((j) => ({ ...j, tag: 'zamanlı' })),
            ]
              .slice(0, 8)
              .map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{j.title}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {j.kind} · {new Date(j.dueAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-lykia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-lykia-300">
                    {j.tag}
                  </span>
                </li>
              ))}
            {(summary?.upcomingJobs?.length ?? 0) +
              (summary?.readyDirectives?.length ?? 0) ===
              0 && (
              <li className="text-sm text-slate-600">Bekleyen görev yok.</li>
            )}
          </ul>
        </PanelCard>

        <PanelCard title="Operasyon Audit" subtitle="Son olaylar">
          <ul className="max-h-72 space-y-2 overflow-y-auto font-mono text-xs">
            {(summary?.recentAudit ?? []).length === 0 && (
              <li className="font-sans text-sm text-slate-600">Henüz audit kaydı yok.</li>
            )}
            {(summary?.recentAudit ?? []).map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <div className="flex justify-between gap-2 text-slate-600">
                  <span>{new Date(e.at).toLocaleTimeString('tr-TR')}</span>
                  <span className="text-sky-300">{e.actor}</span>
                </div>
                <p className="mt-0.5 text-lykia-300">{e.action}</p>
                <p className="mt-0.5 font-sans text-[11px] text-slate-400">{e.detail}</p>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Son Talimatlar" subtitle="Sunucu arşivinden">
          <ul className="space-y-2">
            {(summary?.recentArchive ?? []).length === 0 && (
              <li className="text-sm text-slate-600">Henüz arşiv kaydı yok.</li>
            )}
            {(summary?.recentArchive ?? []).map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
              >
                <p className="truncate text-sm text-slate-200">{e.text}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(e.completedAt).toLocaleString('tr-TR')} · {e.agents.join(' → ')}
                </p>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Ajan Aktivitesi" subtitle="Arşivdeki görev dağılımı">
          <ul className="space-y-2">
            {(summary?.agentHits ?? []).length === 0 && (
              <li className="text-sm text-slate-600">Veri birikince burada görünür.</li>
            )}
            {(summary?.agentHits ?? []).map((h) => (
              <li
                key={h.agent}
                className="flex items-center justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 font-mono text-sm text-lykia-300">
                  <Sparkles className="size-3.5" />
                  {h.agent}
                </span>
                <span className="text-xs text-slate-400">{h.count} görev</span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Son WhatsApp Bildirimleri" subtitle="REMINDER-AI">
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {(summary?.recentWhatsapp ?? []).map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
              >
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>
                    {m.guest ?? 'misafir'} · {m.provider}/{m.status}
                  </span>
                  <span>{new Date(m.at).toLocaleTimeString('tr-TR')}</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{m.body}</p>
              </li>
            ))}
            {(summary?.recentWhatsapp ?? []).length === 0 && (
              <li className="text-sm text-slate-600">Bildirim yok.</li>
            )}
          </ul>
        </PanelCard>

        <PanelCard title="Son NEXUS Olayları" subtitle="IoT protokolü" className="xl:col-span-2">
          <ul className="max-h-64 space-y-2 overflow-y-auto font-mono text-xs">
            {(summary?.recentNexus ?? []).map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <span className="text-slate-600">
                  {new Date(e.at).toLocaleTimeString('tr-TR')}
                </span>{' '}
                <span className="text-lykia-300">[{e.deviceId}]</span>{' '}
                <span className="text-sky-300">{e.action}</span>
                <span className="text-emerald-200/80"> — {e.detail}</span>
              </li>
            ))}
            {(summary?.recentNexus ?? []).length === 0 && (
              <li className="font-sans text-sm text-slate-600">Olay yok.</li>
            )}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
