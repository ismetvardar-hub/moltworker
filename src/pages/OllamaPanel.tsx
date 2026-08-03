import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Download,
  Globe2,
  HardDrive,
  RefreshCw,
  Server,
  Sparkles,
  XCircle,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import StatusBadge from '../components/StatusBadge';
import {
  OLLAMA_BASE_URL,
  TARGET_MODELS,
  checkOllamaStatus,
  formatBytes,
  isModelInstalled,
  listOllamaModels,
} from '../services/ollama';
import { getAiProviderInfo, type AiProviderInfo } from '../services/aiProvider';
import type { OllamaModel, OllamaStatus } from '../types';

export default function OllamaPanel() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hybrid, setHybrid] = useState<AiProviderInfo | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [nextStatus, providerInfo] = await Promise.all([
      checkOllamaStatus(),
      getAiProviderInfo(),
    ]);
    setStatus(nextStatus);
    setHybrid(providerInfo);

    if (nextStatus.reachable) {
      try {
        setModels(await listOllamaModels());
        setModelsError(null);
      } catch (err) {
        setModels([]);
        setModelsError(err instanceof Error ? err.message : 'Model listesi alınamadı');
      }
    } else {
      setModels([]);
      setModelsError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const health = status === null ? 'unknown' : status.reachable ? 'online' : 'offline';
  const hybridHealth =
    hybrid === null
      ? 'unknown'
      : hybrid.ollama.reachable || hybrid.groqConfigured
        ? 'online'
        : 'offline';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Cpu className="size-6 text-lykia-400" />
            Hibrit AI — Ollama + Groq
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Yerel{' '}
            <code className="rounded bg-obsidian-800 px-1.5 py-0.5 font-mono text-xs text-lykia-300">
              {OLLAMA_BASE_URL}
            </code>{' '}
            öncelik · Groq Free yedek · ETHOS üslup · Agent Reach 0 TL web gözü.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-lykia-500/50 hover:text-lykia-300 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Durumu Yenile
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PanelCard title="Hibrit sağlayıcı" subtitle="aiProvider.ts · auto">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${
                hybridHealth === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : hybridHealth === 'offline'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-slate-500/10 text-slate-400'
              }`}
            >
              <Sparkles className="size-6" />
            </div>
            <div>
              <StatusBadge
                health={hybridHealth}
                label={
                  hybrid
                    ? hybrid.active === 'groq'
                      ? 'Groq Free'
                      : hybrid.ollama.reachable
                        ? 'Ollama'
                        : 'Bekleniyor'
                    : 'Kontrol…'
                }
              />
              <p className="mt-1 text-xs text-slate-500">{hybrid?.note ?? 'Sağlayıcı okunuyor…'}</p>
              <p className="mt-1 text-[11px] text-slate-600">
                Groq anahtar: {hybrid?.groqConfigured ? 'tanımlı' : 'yok (VITE_GROQ_API_KEY)'}
              </p>
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Sunucu Durumu" subtitle="GET /api/version">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${
                health === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : health === 'offline'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-slate-500/10 text-slate-400'
              }`}
            >
              <Server className="size-6" />
            </div>
            <div>
              <StatusBadge health={health} />
              <p className="mt-1 text-xs text-slate-500">
                {status
                  ? status.reachable
                    ? `Sürüm: ${status.version ?? 'bilinmiyor'}`
                    : status.error
                  : 'Kontrol ediliyor…'}
              </p>
              {status && (
                <p className="text-[11px] text-slate-600">
                  Son kontrol: {status.checkedAt.toLocaleTimeString('tr-TR')}
                </p>
              )}
            </div>
          </div>
          {health === 'offline' && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90">
              <p>
                Ollama kapalı — Komuta zinciri şimdilik simülasyonda. Canlı için:
              </p>
              <ol className="list-decimal space-y-1 pl-4 font-mono text-[11px] text-amber-100/90">
                <li>ollama serve</li>
                <li>ollama pull qwen2.5</li>
                <li>veya .env → VITE_GROQ_API_KEY=… (console.groq.com ücretsiz)</li>
              </ol>
              <p>
                CORS gerekirse <code className="font-mono">OLLAMA_ORIGINS=*</code> ekleyin.
              </p>
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Hedef Modeller"
          subtitle="DeepSeek-R1 · Qwen 2.5 · coder"
          className="lg:col-span-1"
        >
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {TARGET_MODELS.map((target) => {
              const installed = isModelInstalled(target, models);
              return (
                <li
                  key={target}
                  className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-slate-100">
                      {target}
                    </span>
                    {installed ? (
                      <CheckCircle2 className="size-5 text-emerald-400" />
                    ) : (
                      <XCircle className="size-5 text-rose-400/80" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {installed ? 'Yüklü ve hazır' : 'Yüklü değil'}
                  </p>
                  {!installed && (
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-lykia-300/80">
                      <Download className="size-3.5" />
                      ollama pull {target}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </PanelCard>
      </div>

      <PanelCard
        title="Agent stack (ücretsiz)"
        subtitle="SKILL.md · 24 skill · Agent Reach · quality gates"
      >
        <ul className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          {[
            ['SKILL.md / CLAUDE.md', 'Ajan anayasası mühürlü'],
            ['24 skill pack', 'spec → plan → build → test → ship'],
            ['Agent Reach', 'Jina / Reddit / X / GitHub · 0 TL'],
            ['npm run gate', 'Stop Slop + typecheck'],
            ['npm run doctor:reach', 'Kanal sağlık kontrolü'],
            ['ETHOS', 'Sade · naif · zarif espri'],
          ].map(([label, detail]) => (
            <li
              key={label}
              className="flex items-start gap-2 rounded-lg border border-obsidian-700 bg-obsidian-950/50 px-3 py-2"
            >
              <Globe2 className="mt-0.5 size-4 shrink-0 text-lykia-400" />
              <span>
                <span className="font-semibold text-slate-100">{label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </PanelCard>

      <PanelCard
        title="Yüklü Modeller"
        subtitle="GET /api/tags — sunucudaki tüm modeller"
        actions={
          <span className="rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-300">
            {models.length} model
          </span>
        }
      >
        {modelsError && <p className="text-sm text-rose-300">{modelsError}</p>}
        {!modelsError && models.length === 0 && (
          <p className="text-sm text-slate-500">
            {health === 'online'
              ? 'Sunucuda yüklü model bulunamadı.'
              : 'Model listesi için Ollama sunucusuna bağlanılamadı.'}
          </p>
        )}
        {models.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-obsidian-700 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Model</th>
                  <th className="pb-3 pr-4">Aile</th>
                  <th className="pb-3 pr-4">Parametre</th>
                  <th className="pb-3 pr-4">Boyut</th>
                  <th className="pb-3">Güncelleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-700/60">
                {models.map((m) => (
                  <tr key={m.name}>
                    <td className="py-3 pr-4 font-mono text-slate-100">{m.name}</td>
                    <td className="py-3 pr-4 text-slate-400">{m.details?.family ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-400">
                      {m.details?.parameter_size ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <HardDrive className="size-3.5 text-slate-600" />
                        {formatBytes(m.size)}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(m.modified_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </div>
  );
}
