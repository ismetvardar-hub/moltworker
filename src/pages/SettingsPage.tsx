import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, KeyRound, Radar, RotateCw, Save, Shield, Sparkles } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  ackSettingsFlag,
  fetchSettings,
  refreshSettingsSnapshot,
  runSettingsSweep,
  saveSettings,
  seedDefaultSettings,
  type SettingField,
  type SettingsSummary,
  type SettingsResponse,
} from '../services/settings';

const GROUP_LABELS: Record<string, string> = {
  herodot: 'HERODOT — Canlı Web Arama',
  whatsapp: 'REMINDER-AI — WhatsApp',
  nexus: 'NEXUS — IoT Köprüsü',
};

export default function SettingsPage() {
  const [fields, setFields] = useState<SettingField[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<SettingsSummary | null>(null);
  const [opsBusy, setOpsBusy] = useState(false);
  const [opsFlash, setOpsFlash] = useState<string | null>(null);

  const applyResponse = (data: SettingsResponse) => {
    setFields(data.fields);
    setUpdatedAt(data.updatedAt);
    setSummary(data.summary ?? null);
    const next: Record<string, string> = {};
    for (const f of data.fields) next[f.key] = f.secret ? '' : f.value;
    setDraft(next);
  };

  const reloadSettings = async () => {
    applyResponse(await fetchSettings());
  };

  useEffect(() => {
    void (async () => {
      try {
        await reloadSettings();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ayarlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = [...new Set(fields.map((f) => f.group))];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const patch: Record<string, string> = {};
      for (const f of fields) {
        const val = (draft[f.key] ?? '').trim();
        if (f.secret && !val) continue;
        patch[f.key] = val;
      }
      applyResponse(await saveSettings(patch));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const runOps = async (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    if (opsBusy) return;
    setOpsBusy(true);
    setOpsFlash(null);
    setError(null);
    try {
      const result = await fn();
      await reloadSettings();
      setOpsFlash(result.ok === false ? result.error || `${label} başarısız` : `${label} OK`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} başarısız`);
    } finally {
      setOpsBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Ayarlar yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <KeyRound className="size-6 text-lykia-400" />
          Platform Ayarları
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          API anahtarları ve köprü uçları. Secret alanlar maskelenir; boş bırakmak mevcut değeri korur.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="size-4" />
          Ayarlar kaydedildi ve çalışma zamanına uygulandı.
        </div>
      )}
      <PanelCard
        title="Settings Ops"
        subtitle="Hafif sweep / ack ve güvenli altyapı mutatorları"
      >
        <div className="space-y-4">
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-xl border border-obsidian-700 bg-obsidian-950/70 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Configured</p>
              <p className="mt-1 font-mono text-lykia-300">
                {summary ? `${summary.configured}/${summary.total}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-obsidian-700 bg-obsidian-950/70 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Missing / stale</p>
              <p className="mt-1 font-mono text-amber-300">
                {summary ? `${summary.missing} / ${summary.stale ? 'yes' : 'no'}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-obsidian-700 bg-obsidian-950/70 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Flags</p>
              <p className="mt-1 font-mono text-rose-300">
                {summary ? `${summary.flags_open} open` : '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => void runOps('Sweep', () => runSettingsSweep({ force: true }))}
              className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-3 py-2 text-sm font-semibold text-obsidian-950 disabled:opacity-50"
            >
              <Radar className="size-4" />
              Sweep
            </button>
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => void runOps('Flag ack', () => ackSettingsFlag({}))}
              className="inline-flex items-center gap-2 rounded-xl bg-obsidian-800 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
            >
              <ClipboardCheck className="size-4" />
              Ack flag
            </button>
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => void runOps('Snapshot refresh', () => refreshSettingsSnapshot({ reason: 'toolbar' }))}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500/20 px-3 py-2 text-sm text-sky-100 disabled:opacity-50"
            >
              <RotateCw className="size-4" />
              Refresh snapshot
            </button>
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => void runOps('Seed defaults', () => seedDefaultSettings({}))}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 px-3 py-2 text-sm text-amber-100 disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              Seed defaults
            </button>
          </div>
          {opsFlash && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {opsFlash}
            </p>
          )}
          {summary?.summaryLines?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
              {summary.summaryLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </PanelCard>

      <form onSubmit={(e) => void submit(e)} className="space-y-6">
        {groups.map((group) => (
          <PanelCard
            key={group}
            title={GROUP_LABELS[group] ?? group}
            subtitle={`${fields.filter((f) => f.group === group && f.configured).length} yapılandırılmış`}
          >
            <div className="space-y-3">
              {fields
                .filter((f) => f.group === group)
                .map((f) => (
                  <label key={f.key} className="block">
                    <span className="flex items-center justify-between text-xs font-medium text-slate-400">
                      <span>{f.label}</span>
                      <span
                        className={`font-mono text-[10px] ${
                          f.configured ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      >
                        {f.configured ? `${f.source}` : 'boş'}
                      </span>
                    </span>
                    <input
                      type={f.secret ? 'password' : 'text'}
                      value={draft[f.key] ?? ''}
                      placeholder={
                        f.secret
                          ? f.configured
                            ? '•••• (değiştirmek için yeni değer)'
                            : 'Anahtar girin'
                          : 'Değer'
                      }
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [f.key]: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 font-mono text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                      autoComplete="off"
                    />
                  </label>
                ))}
            </div>
          </PanelCard>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Shield className="size-3.5" />
            Yalnızca CEO rolü ·{' '}
            {updatedAt
              ? `son güncelleme ${new Date(updatedAt).toLocaleString('tr-TR')}`
              : 'henüz kayıt yok'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-5 py-2.5 text-sm font-semibold text-obsidian-950 transition hover:bg-lykia-400 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Kaydediliyor…' : 'Kaydet & Uygula'}
          </button>
        </div>
      </form>
    </div>
  );
}
