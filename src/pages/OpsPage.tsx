import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Download,
  HardDrive,
  RefreshCw,
  Upload,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  clearOpsDegraded,
  downloadBackup,
  fetchCampusHealth,
  fetchDataFiles,
  fetchHealth,
  quarantineOpsFile,
  restoreBackup,
  rotateOpsBackup,
  runOpsIntegritySweep,
  type HealthReport,
} from '../services/ops';

export default function OpsPage() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [campus, setCampus] = useState<HealthReport['campus'] | null>(null);
  const [files, setFiles] = useState<Array<{ name: string; bytes: number; mtime: string }>>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [h, f, c] = await Promise.all([
        fetchHealth(),
        fetchDataFiles(),
        fetchCampusHealth().catch(() => null),
      ]);
      setHealth(h);
      setFiles(f);
      setCampus(c || h.campus || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ops verisi alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const onRestoreFile = async (file: File) => {
    setMessage(null);
    setError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const result = await restoreBackup(json);
      setMessage(`Geri yüklendi: ${result.restored.join(', ')}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geri yükleme başarısız');
    }
  };

  const statusColor =
    health?.status === 'healthy'
      ? 'text-emerald-300'
      : health?.status === 'degraded'
        ? 'text-amber-300'
        : 'text-rose-300';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <HardDrive className="size-6 text-lykia-400" />
            Sistem & Yedekleme
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Healthcheck, data dosyaları ve tam JSON yedek / geri yükleme.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void runOpsIntegritySweep({ force: true }).then((r: any) => {
                setMessage(`Integrity · ${r.sweep?.scanned ?? 0} dosya · ${r.issues?.length ?? 0} issue`)
                return refresh()
              }).catch((e) => setError(e instanceof Error ? e.message : 'Integrity başarısız'))
            }
            className="rounded-xl border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-sm text-slate-200"
          >
            Integrity
          </button>
          <button
            type="button"
            onClick={() =>
              void rotateOpsBackup({ note: 'ops rotate' }).then((r: any) => {
                setMessage(`Rotate · ${r.rotation?.collections ?? 0} koleksiyon`)
                return refresh()
              }).catch((e) => setError(e instanceof Error ? e.message : 'Rotate başarısız'))
            }
            className="rounded-xl border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-sm text-slate-200"
          >
            Backup rotate
          </button>
          <button
            type="button"
            onClick={() =>
              void quarantineOpsFile({ file: 'ops-quarantine.json', reason: 'ops self-check' }).then((r: any) => {
                setMessage(r.ok ? `Karantina · ${r.quarantine?.file}` : r.error || 'Karantina yok')
                return refresh()
              }).catch((e) => setError(e instanceof Error ? e.message : 'Karantina başarısız'))
            }
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
          >
            Quarantine
          </button>
          <button
            type="button"
            onClick={() =>
              void clearOpsDegraded({ force: true }).then((r: any) => {
                setMessage(`Degraded clear · ${r.cleared ?? 0}`)
                return refresh()
              }).catch((e) => setError(e instanceof Error ? e.message : 'Clear başarısız'))
            }
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
          >
            Clear degraded
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200"
          >
            <RefreshCw className="size-4" />
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelCard className="!p-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Activity className="size-3.5" />
            Health
          </p>
          <p className={`mt-3 text-3xl font-bold uppercase ${statusColor}`}>
            {health?.status ?? '—'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            uptime {health ? `${health.uptimeSec}s` : '—'} · v{health?.version ?? '—'}
          </p>
        </PanelCard>
        <PanelCard className="!p-0 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kontroller</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 font-mono text-xs">
            {Object.entries(health?.checks ?? {}).map(([k, v]) => (
              <li
                key={k}
                className="flex justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <span className="text-slate-500">{k}</span>
                <span className="text-lykia-300">{String(v)}</span>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      {campus && (
        <PanelCard title="Kampüs sağlığı" subtitle="/api/campus/health">
          <dl className="grid grid-cols-2 gap-3 text-sm text-slate-300 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Durum</dt>
              <dd className="text-lykia-200">{campus.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Skor</dt>
              <dd className="text-2xl font-semibold text-lykia-200">{campus.score ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Alert</dt>
              <dd>{campus.alerts ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Warn</dt>
              <dd>{campus.warns ?? 0}</dd>
            </div>
          </dl>
          <ul className="mt-3 max-h-28 space-y-1 overflow-auto text-xs text-slate-400">
            {(campus.actions || []).slice(0, 6).map((a, i) => (
              <li key={`${a.href}-${i}`}>
                [{a.level}] {a.text}
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Yedekleme" subtitle="likya-backup-v1">
          <p className="mb-4 text-sm text-slate-400">
            Arşiv, WhatsApp, NEXUS, audit, jobs, settings, venues, notifications ve sessions.
          </p>
          <button
            type="button"
            onClick={() => void downloadBackup()}
            className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400"
          >
            <Download className="size-4" />
            Yedeği İndir
          </button>
          <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-obsidian-600 px-4 py-3 text-sm text-slate-300 hover:border-lykia-500/40">
            <Upload className="size-4 text-lykia-400" />
            JSON yedekten geri yükle
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onRestoreFile(f);
                e.target.value = '';
              }}
            />
          </label>
        </PanelCard>

        <PanelCard title="data/ Dosyaları" subtitle="Sunucu kalıcı depo">
          <ul className="max-h-80 space-y-2 overflow-y-auto font-mono text-xs">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <span className="text-lykia-300">{f.name}</span>
                <span className="text-slate-500">
                  {(f.bytes / 1024).toFixed(1)} KB ·{' '}
                  {new Date(f.mtime).toLocaleString('tr-TR')}
                </span>
              </li>
            ))}
            {files.length === 0 && (
              <li className="font-sans text-sm text-slate-600">Dosya yok.</li>
            )}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
