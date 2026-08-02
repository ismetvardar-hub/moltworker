import { useCallback, useEffect, useState } from 'react';
import { Download, FileJson, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import * as api from '../services/report';
import type { OpsReport } from '../services/report';

export default function ReportsPage() {
  const [report, setReport] = useState<OpsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setReport(await api.fetchOpsReport());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rapor alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function ping(m: string) {
    setFlash(m);
    window.setTimeout(() => setFlash(null), 2800);
  }

  const ethos = report?.ethos;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <ShieldCheck className="size-6 text-lykia-400" />
            Operasyon Raporu & ETHOS
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Arşiv, entegrasyon ve Master Kural uyum özeti · JSON / Markdown dışa aktarma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-lykia-500/40"
          >
            <RefreshCw className="size-4" />
            Yenile
          </button>
          <button
            type="button"
            onClick={() => void api.downloadReport('json')}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-lykia-500/40"
          >
            <FileJson className="size-4" />
            JSON
          </button>
          <button
            type="button"
            onClick={() => void api.downloadReport('markdown')}
            className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400"
          >
            <FileText className="size-4" />
            Markdown
          </button>
        </div>
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

      {report && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title={report.title || 'Report ops'}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(report.summaryLines || []).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runReportSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh(); })}>Sweep</button>
              <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.cancelReportJobs({}).then((r: any) => { ping(`Cancel ${r.cancelled?.length ?? 0}`); return refresh(); })}>Jobs cancel</button>
              <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.ackReportEthos({}).then((r: any) => { ping(r.ok ? 'ETHOS ack' : r.error || 'Ack yok'); return refresh(); })}>ETHOS ack</button>
              <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.snapshotReportAudit({}).then((r: any) => { ping(`Snapshot ${r.snapshot?.id ? 'ok' : '—'}`); return refresh(); })}>Audit snapshot</button>
              <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackReportFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh(); })}>Flag ack</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Flag {report.summary?.flags_open ?? 0} · backlog {report.summary?.jobs_backlog ?? 0} · ETHOS {report.summary?.ethos_grade ?? ethos?.grade}
            </p>
          </PanelCard>
          <PanelCard title="Açık flagler">
            <ul className="space-y-2 text-sm">
              {(report.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
              {(report.flags || []).slice(0, 10).map((f: any) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                  <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                  <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackReportFlag({ id: f.id }).then(() => { ping('Ack'); return refresh(); })}>Ack</button>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelCard className="!p-0 lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ETHOS Skoru</p>
          <p className="mt-3 font-display text-5xl font-bold text-lykia-300">
            {ethos?.score ?? '—'}
            <span className="text-lg text-slate-600">/100</span>
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Not: <span className="font-mono text-lykia-300">{ethos?.grade ?? '—'}</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {ethos?.masterRule}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Onay {ethos?.passed ?? 0} · Red {ethos?.failed ?? 0} · Eksik {ethos?.missing ?? 0}
          </p>
        </PanelCard>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          {[
            ['Arşiv', report?.counts.archive],
            ['WhatsApp', report?.counts.whatsapp],
            ['NEXUS', report?.counts.nexus],
            ['Audit', report?.counts.audit],
            ['Görevler', report?.counts.jobs],
            [
              'Ayarlar',
              report
                ? `${report.counts.settingsConfigured}/${report.counts.settingsTotal}`
                : '—',
            ],
          ].map(([label, value]) => (
            <PanelCard key={String(label)} className="!p-0">
              <p className="text-2xl font-bold text-slate-50">{value ?? '—'}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </PanelCard>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="ETHOS Örnekleri" subtitle="Son denetim sonuçları">
          <ul className="space-y-2">
            {(ethos?.samples ?? []).length === 0 && (
              <li className="text-sm text-slate-600">
                Henüz ETHOS adımı içeren arşiv yok — Komuta&apos;dan zincir çalıştırın.
              </li>
            )}
            {(ethos?.samples ?? []).map((s) => (
              <li
                key={`${s.id}-${s.at}`}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
              >
                <div className="flex justify-between gap-2">
                  <p className="truncate text-sm text-slate-200">{s.text}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      s.verdict === 'onay'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {s.verdict}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Ajan Sıralaması" subtitle="Arşiv görev sayıları">
          <ul className="space-y-2">
            {(report?.topAgents ?? []).map((a) => (
              <li
                key={a.agent}
                className="flex justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2 font-mono text-sm"
              >
                <span className="text-lykia-300">{a.agent}</span>
                <span className="text-slate-500">{a.count}</span>
              </li>
            ))}
            {(report?.topAgents ?? []).length === 0 && (
              <li className="text-sm text-slate-600">Veri yok.</li>
            )}
          </ul>
        </PanelCard>

        <PanelCard title="Son Talimatlar" subtitle="Rapordan" className="xl:col-span-2">
          <ul className="space-y-2">
            {(report?.recentArchive ?? []).map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
              >
                <p className="text-sm text-slate-200">{e.text}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {e.status} · {(e.agents ?? []).join(' → ')}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <Download className="size-3.5" />
            Tam rapor için JSON veya Markdown indirin.
            {report && (
              <span className="ml-auto font-mono">
                {new Date(report.generatedAt).toLocaleString('tr-TR')}
              </span>
            )}
          </p>
        </PanelCard>
      </div>
    </div>
  );
}
