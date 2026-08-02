import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, RefreshCw } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import * as api from '../services/metrics';
import { fetchMetrics, type MetricsReport } from '../services/metrics';

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number | null | undefined;
  detail?: string;
}) {
  return (
    <PanelCard className="!p-0">
      <p className="text-2xl font-bold text-slate-50">{value ?? '—'}</p>
      <p className="mt-1 text-sm text-slate-300">{label}</p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
    </PanelCard>
  );
}

export default function MetricsPage() {
  const [m, setM] = useState<MetricsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setM(await fetchMetrics());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Metrikler alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 6000);
    return () => clearInterval(t);
  }, [refresh]);

  function ping(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2800);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <BarChart3 className="size-6 text-lykia-400" />
            Gözlemlenebilirlik
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Zincir başarı oranı, geçiş, WhatsApp, görev ve sistem sağlığı (AŞAMA 15)
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
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}

      {m && (
        <PanelCard title={m.title || 'Ops'}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(m.summaryLines || []).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runMetricsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh(); })}>Sweep</button>
            <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.snapshotMetrics({}).then((r: any) => { ping(`Snapshot ${r.snapshot?.id ? 'ok' : '—'}`); return refresh(); })}>Snapshot</button>
            <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.purgeFailedJobs({}).then((r: any) => { ping(`Purge ${r.cancelled?.length ?? 0}`); return refresh(); })}>Jobs purge</button>
            <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.ackEthosFails({}).then((r: any) => { ping(r.ok ? 'ETHOS ack' : r.error || 'Ack yok'); return refresh(); })}>ETHOS ack</button>
            <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackMetricsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh(); })}>Flag ack</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Flag {(m.summary as any)?.flags_open ?? 0} · ETHOS fail {m.chain?.ethosFail ?? 0} · fail jobs {m.jobs?.failed ?? 0}
          </p>
        </PanelCard>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Sistem"
          value={m?.health?.toUpperCase()}
          detail={`uptime ${m?.uptimeSec ?? '—'}s · SSE ${m?.sseClients ?? 0}`}
        />
        <Stat
          label="Zincir başarı"
          value={m?.chain.successRate != null ? `%${m.chain.successRate}` : '—'}
          detail={`${m?.chain.archiveOk ?? 0} ok / ${m?.chain.archiveFail ?? 0} hata`}
        />
        <Stat
          label="Ort. zincir süresi"
          value={
            m?.chain.avgChainMs != null
              ? `${(m.chain.avgChainMs / 1000).toFixed(1)}s`
              : '—'
          }
          detail={`${m?.chain.stepsTotal ?? 0} adım`}
        />
        <Stat
          label="Geçiş izin oranı"
          value={m?.pass.allowRate != null ? `%${m.pass.allowRate}` : '—'}
          detail={`${m?.pass.allowed ?? 0} izin / ${m?.pass.denied ?? 0} red`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aktif kart" value={m?.pass.activeHolders} detail={`${m?.pass.holders ?? 0} toplam`} />
        <Stat
          label="WhatsApp"
          value={m?.integrations.whatsappTotal}
          detail={`canlı ${m?.integrations.whatsappLive ?? 0} · mock ${m?.integrations.whatsappMock ?? 0}`}
        />
        <Stat
          label="Görev kuyruğu"
          value={m?.jobs.total}
          detail={`hazır ${m?.jobs.ready ?? 0} · zamanlı ${m?.jobs.scheduled ?? 0}`}
        />
        <Stat
          label="ETHOS"
          value={`${m?.chain.ethosOk ?? 0}/${(m?.chain.ethosOk ?? 0) + (m?.chain.ethosFail ?? 0)}`}
          detail={`bildirim ${m?.unreadNotifications ?? 0} · tesis ${m?.venues.active ?? 0}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Ajan Hata Sıralaması" subtitle="Arşiv adımlarından">
          <ul className="space-y-2">
            {(m?.chain.topFailures ?? []).length === 0 && (
              <li className="text-sm text-slate-600">Henüz hata kaydı yok.</li>
            )}
            {(m?.chain.topFailures ?? []).map((f) => (
              <li
                key={f.agent}
                className="flex justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2 font-mono text-sm"
              >
                <span className="text-rose-300">{f.agent}</span>
                <span className="text-slate-500">{f.count}</span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Entegrasyon & Audit" subtitle="Hacim">
          <ul className="space-y-2 font-mono text-sm">
            {[
              ['NEXUS olay', m?.integrations.nexusEvents],
              ['Audit', m?.integrations.auditEvents],
              ['Geçiş olayı', m?.pass.events],
              ['Kapı', m?.pass.gates],
              ['Tesis', m?.venues.total],
            ].map(([label, value]) => (
              <li
                key={String(label)}
                className="flex items-center justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <Activity className="size-3.5 text-lykia-400" />
                  {label}
                </span>
                <span className="text-lykia-300">{value ?? '—'}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-600">
            Son üretim:{' '}
            {m ? new Date(m.generatedAt).toLocaleString('tr-TR') : '—'}
          </p>
        </PanelCard>
      </div>
    </div>
  );
}
