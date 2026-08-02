import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Wand2,
  XCircle,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  ackJobsFlag,
  cancelJob,
  createJob,
  fetchJobs,
  purgeFailedJobs,
  retryFailedJob,
  runJobNow,
  runJobsSweep,
  seedQueuedJob,
  type Job,
  type JobKind,
  type JobsSummary,
} from '../services/jobs';

function statusClass(status: string): string {
  switch (status) {
    case 'done':
    case 'ready':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'scheduled':
      return 'bg-sky-500/15 text-sky-300';
    case 'running':
      return 'bg-lykia-500/15 text-lykia-300';
    case 'failed':
      return 'bg-rose-500/15 text-rose-300';
    case 'cancelled':
      return 'bg-slate-500/15 text-slate-400';
    default:
      return 'bg-slate-500/15 text-slate-400';
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<JobsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<JobKind>('whatsapp.reminder');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('Siparişiniz hazır — LİKYA Centilmen servisiyle afiyet olsun.');
  const [to, setTo] = useState('+905551112233');
  const [directive, setDirective] = useState('');
  const [delayMin, setDelayMin] = useState(0);
  const [saving, setSaving] = useState(false);
  const [opsBusy, setOpsBusy] = useState<string | null>(null);
  const [opsFlash, setOpsFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(data.jobs);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Görevler alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const dueAt = new Date(Date.now() + delayMin * 60_000).toISOString();
      if (kind === 'whatsapp.reminder') {
        await createJob({
          kind,
          title: title || 'WhatsApp hatırlatması',
          dueAt,
          payload: { body, to, guest: 'misafir' },
        });
      } else {
        await createJob({
          kind,
          title: title || directive.slice(0, 60) || 'Kuyruk talimatı',
          dueAt,
          payload: { text: directive },
        });
      }
      setTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız');
    } finally {
      setSaving(false);
    }
  };

  const runOps = async (key: string, label: string, fn: () => Promise<unknown>) => {
    if (opsBusy) return;
    setOpsBusy(key);
    setError(null);
    try {
      await fn();
      setOpsFlash(`${label} OK`);
      window.setTimeout(() => setOpsFlash(null), 2800);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} başarısız`);
    } finally {
      setOpsBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <ListTodo className="size-6 text-lykia-400" />
            Görev Kuyruğu
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Zamanlanmış WhatsApp hatırlatmaları ve Komuta talimat kuyruğu.
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Toplam', summary?.total ?? '—'],
          ['Zamanlanmış', summary?.byStatus?.scheduled ?? 0],
          ['Hazır talimat', summary?.readyDirectives?.length ?? 0],
          ['Tamamlanan', summary?.byStatus?.done ?? 0],
        ].map(([label, value]) => (
          <PanelCard key={label} className="!p-0">
            <p className="text-2xl font-bold text-slate-50">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </PanelCard>
        ))}
      </div>

      <PanelCard title="Görev Operasyonları" subtitle="Failed aging · stuck running · queued backlog">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!opsBusy}
            onClick={() => void runOps('sweep', 'Sweep', () => runJobsSweep({ force: true }))}
            className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-3 py-2 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400 disabled:opacity-50"
          >
            <AlertTriangle className="size-4" />
            Sweep
          </button>
          <button
            type="button"
            disabled={!!opsBusy}
            onClick={() => void runOps('ack', 'Flag ack', () => ackJobsFlag({}))}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            Flag ack
          </button>
          <button
            type="button"
            disabled={!!opsBusy}
            onClick={() => void runOps('retry', 'Retry failed', () => retryFailedJob({ delayMinutes: 0 }))}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-sky-500/40 hover:text-sky-300 disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
            Retry failed
          </button>
          <button
            type="button"
            disabled={!!opsBusy}
            onClick={() => void runOps('purge', 'Purge failed', () => purgeFailedJobs({ limit: 10 }))}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Purge failed
          </button>
          <button
            type="button"
            disabled={!!opsBusy}
            onClick={() =>
              void runOps('seed', 'Seed queued', () =>
                seedQueuedJob({ title: 'Ops queued directive', text: 'Jobs ops queued directive' }),
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-lykia-500/40 hover:text-lykia-300 disabled:opacity-50"
          >
            <Wand2 className="size-4" />
            Seed queued
          </button>
        </div>
        {opsFlash && (
          <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {opsFlash}
          </p>
        )}
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {(summary?.flags || []).slice(0, 6).map((flag) => (
            <div key={flag.id} className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-lykia-300">
                {flag.level} · {flag.domain}
              </p>
              <p className="mt-1 text-sm text-slate-300">{flag.text}</p>
            </div>
          ))}
          {(summary?.flags || []).length === 0 && (
            <p className="text-sm text-slate-500">Açık jobs flag yok.</p>
          )}
        </div>
      </PanelCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Yeni Görev" subtitle="REMINDER-AI veya talimat kuyruğu">
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            <div className="flex gap-2">
              {(
                [
                  ['whatsapp.reminder', 'WhatsApp', MessageCircle],
                  ['directive.queue', 'Talimat', ListTodo],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKind(id)}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    kind === id
                      ? 'border-lykia-500/50 bg-lykia-500/15 text-lykia-300'
                      : 'border-obsidian-700 text-slate-400 hover:border-obsidian-600'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-xs text-slate-400">Başlık</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                placeholder="Opsiyonel başlık"
              />
            </label>

            {kind === 'whatsapp.reminder' ? (
              <>
                <label className="block">
                  <span className="text-xs text-slate-400">Alıcı</span>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Mesaj</span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="text-xs text-slate-400">Talimat metni</span>
                <textarea
                  value={directive}
                  onChange={(e) => setDirective(e.target.value)}
                  rows={4}
                  required
                  placeholder="Örn: OlymposPass için Almanca lansman metni hazırla"
                  className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                />
              </label>
            )}

            <label className="block">
              <span className="text-xs text-slate-400">Gecikme (dakika) — 0 = hemen</span>
              <input
                type="number"
                min={0}
                max={1440}
                value={delayMin}
                onChange={(e) => setDelayMin(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400 disabled:opacity-50"
            >
              <Plus className="size-4" />
              {saving ? 'Oluşturuluyor…' : 'Görevi Zamanla'}
            </button>
          </form>
        </PanelCard>

        <PanelCard title="Görev Listesi" subtitle="Son 200 kayıt">
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
            {jobs.length === 0 && (
              <li className="text-sm text-slate-600">Henüz görev yok.</li>
            )}
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{job.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                      {job.kind} · {job.createdBy}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(job.status)}`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="size-3" />
                  due {new Date(job.dueAt).toLocaleString('tr-TR')}
                </p>
                {job.error && (
                  <p className="mt-1 text-xs text-rose-300">{job.error}</p>
                )}
                <div className="mt-2 flex gap-2">
                  {(job.status === 'scheduled' || job.status === 'failed') && (
                    <button
                      type="button"
                      onClick={() => void runJobNow(job.id).then(() => refresh())}
                      className="inline-flex items-center gap-1 rounded-lg border border-obsidian-700 px-2 py-1 text-[11px] text-slate-300 hover:border-lykia-500/40 hover:text-lykia-300"
                    >
                      <Play className="size-3" />
                      Çalıştır
                    </button>
                  )}
                  {(job.status === 'scheduled' || job.status === 'ready') && (
                    <button
                      type="button"
                      onClick={() => void cancelJob(job.id).then(() => refresh())}
                      className="inline-flex items-center gap-1 rounded-lg border border-obsidian-700 px-2 py-1 text-[11px] text-slate-300 hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <XCircle className="size-3" />
                      İptal
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
