import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  Cpu,
  ExternalLink,
  Globe2,
  Inbox,
  Loader2,
  Play,
  Send,
  ShieldCheck,
  Square,
  Ticket,
  Workflow,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import StatusBadge from '../components/StatusBadge';
import ArchivePanel from '../components/ArchivePanel';
import {
  TARGET_MODELS,
  checkOllamaStatus,
  isModelInstalled,
  listOllamaModels,
  resolveModel,
  streamGenerate,
} from '../services/ollama';
import {
  buildPipeline,
  buildStepPrompt,
  simulatedStepOutput,
} from '../services/orchestrator';
import {
  buildResearchPrompt,
  buildSearchLogLines,
  fetchLiveSources,
  reportFromSources,
  type ResearchSource,
} from '../services/research';
import {
  buildArchiveEntry,
  loadArchive,
  saveArchiveEntry,
  type ArchiveEntry,
} from '../services/archive';
import { syncArchiveToServer } from '../services/hub';
import {
  claimDirective,
  fetchReadyDirectives,
  type Job,
} from '../services/jobs';
import LiveFeed from '../components/LiveFeed';
import { fetchPlaybooks, type Playbook } from '../services/playbooks';
import { getStoredUser } from '../services/auth';
import { fetchCampusBrief } from '../services/campusbrief';
import { AGENTS } from '../data/agents';
import { uid } from '../utils/uid';
import type {
  Directive,
  OllamaModel,
  PipelineStep,
  PipelineStepStatus,
  SystemHealth,
} from '../types';

interface SystemCard {
  title: string;
  value: string;
  detail: string;
  health: SystemHealth;
  icon: typeof Cpu;
}

const INITIAL_DIRECTIVES: Directive[] = [
  {
    id: 1,
    text: 'OlymposPass giriş kapılarındaki doğrulama gecikmesini analiz et.',
    issuedAt: new Date(Date.now() - 42 * 60_000),
    status: 'tamamlandi',
  },
];

const STATUS_LABEL: Record<Directive['status'], { label: string; cls: string }> = {
  kuyrukta: { label: 'Kuyrukta', cls: 'bg-slate-500/15 text-slate-300' },
  isleniyor: { label: 'İşleniyor', cls: 'bg-amber-500/15 text-amber-300' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-emerald-500/15 text-emerald-300' },
  hata: { label: 'Hata', cls: 'bg-rose-500/15 text-rose-300' },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function chunked(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

// ─── Zincir adımı görünümü ────────────────────────────────────────────

const STEP_ICON: Record<PipelineStepStatus, () => React.JSX.Element> = {
  bekliyor: () => <Circle className="size-4 text-slate-600" />,
  calisiyor: () => <Loader2 className="size-4 animate-spin text-amber-300" />,
  tamamlandi: () => <CheckCircle2 className="size-4 text-emerald-400" />,
  hata: () => <AlertTriangle className="size-4 text-rose-400" />,
};

function PipelineStepView({ step, index }: { step: PipelineStep; index: number }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const isEthos = step.assignment.agentId === 'ethos';
  const isHerodot = step.assignment.agentId === 'herodot';

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [step.output]);

  return (
    <li
      className={`rounded-xl border ${
        step.status === 'calisiyor'
          ? 'border-lykia-500/40 bg-lykia-500/5'
          : 'border-obsidian-700 bg-obsidian-950/60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="font-mono text-[11px] text-slate-600">{index + 1}.</span>
        {STEP_ICON[step.status]()}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            {step.assignment.agentName}
            {isEthos && <ShieldCheck className="size-3.5 text-lykia-400" />}
            {isHerodot && <Globe2 className="size-3.5 text-sky-400" />}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {step.assignment.subtask}
            <span className="font-mono"> · {step.engine}</span>
            {step.searchProvider && (
              <span className="ml-1 font-mono text-sky-400/80">
                · {step.searchLive ? 'canlı' : 'fallback'}:{step.searchProvider}
              </span>
            )}
          </p>
        </div>
        {index > 0 && step.status !== 'bekliyor' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <ChevronDown className="size-3" />
            devraldı
          </span>
        )}
      </div>
      {step.output && (
        <div
          ref={bodyRef}
          className="max-h-44 overflow-y-auto whitespace-pre-wrap border-t border-obsidian-700/60 px-4 py-3 font-mono text-xs leading-5 text-emerald-200/90"
        >
          {step.output}
          {step.status === 'calisiyor' && (
            <span className="cursor-blink ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-lykia-400" />
          )}
        </div>
      )}
      {step.sources && step.sources.length > 0 && (
        <div className="border-t border-obsidian-700/60 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
            <Globe2 className="size-3.5" />
            Canlı Web Kaynakları
            {step.searchProvider && (
              <span className="font-mono font-normal normal-case text-slate-600">
                ({step.searchProvider}
                {step.searchLive === false ? ' · fallback' : ''})
              </span>
            )}
          </p>
          <ul className="space-y-2">
            {step.sources.map((s) => (
              <li key={s.url} className="rounded-lg border border-obsidian-700 bg-obsidian-950/80 p-2.5">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  <ExternalLink className="mt-0.5 size-3 shrink-0" />
                  <span>{s.title}</span>
                </a>
                <p className="mt-0.5 truncate font-mono text-[10px] text-slate-600">{s.url}</p>
                {s.snippet && (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{s.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

// ─── Komuta Merkezi ───────────────────────────────────────────────────

export default function CommandCenter() {
  const [directives, setDirectives] = useState<Directive[]>(INITIAL_DIRECTIVES);
  const [draft, setDraft] = useState('');
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [installed, setInstalled] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState<string>(TARGET_MODELS[0]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [pipelineTitle, setPipelineTitle] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [readyJobs, setReadyJobs] = useState<Job[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [campusPulse, setCampusPulse] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const issueRef = useRef<(text?: string) => Promise<void>>(async () => undefined);

  useEffect(() => {
    setArchive(loadArchive());
    const pending = sessionStorage.getItem('likya-pending-directive');
    if (pending) {
      sessionStorage.removeItem('likya-pending-directive');
      setDraft(pending);
    }
    const brandId = getStoredUser()?.activeBrandId;
    void fetchPlaybooks(brandId).then(setPlaybooks);
    void fetchCampusBrief()
      .then(setCampusPulse)
      .catch(() => setCampusPulse(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const jobs = await fetchReadyDirectives();
        if (!cancelled) setReadyJobs(jobs);
      } catch {
        /* kuyruk opsiyonel */
      }
    };
    void pull();
    const t = setInterval(() => void pull(), 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await checkOllamaStatus();
      if (cancelled) return;
      setAiOnline(status.reachable);
      if (status.reachable) {
        try {
          const models = await listOllamaModels();
          if (cancelled) return;
          setInstalled(models);
          const available = TARGET_MODELS.find((t) => isModelInstalled(t, models));
          const exactName = models.find((m) =>
            m.name.toLowerCase().startsWith((available ?? '').toLowerCase()),
          )?.name;
          if (exactName) setModel(exactName);
          else if (models.length > 0) setModel(models[0].name);
        } catch {
          /* model listesi alınamazsa hedef listeyle devam edilir */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDirective = (id: number, patch: Partial<Directive>) => {
    setDirectives((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const restoreArchive = (entry: ArchiveEntry) => {
    setPipelineTitle(entry.text);
    setPipeline(
      entry.steps.map((s) => ({
        assignment: {
          agentId: s.agentId,
          agentName: s.agentName,
          subtask: s.subtask,
        },
        engine: s.engine,
        status: s.status,
        output: s.output,
        sources: s.sources,
        searchProvider: s.searchProvider,
        searchLive: s.searchLive,
      })),
    );
  };

  const issueDirective = async (overrideText?: string) => {
    const text = (overrideText ?? draft).trim();
    if (!text || streaming) return;

    const steps = buildPipeline(text);
    // Çalışma kopyası: React state asenkron olduğu için arşive buradan yazılır.
    let working: PipelineStep[] = steps.map((s) => ({ ...s }));
    const syncPipeline = (next: PipelineStep[]) => {
      working = next;
      setPipeline(next);
    };
    const patchStep = (index: number, patch: Partial<PipelineStep>) => {
      syncPipeline(working.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const directive: Directive = {
      id: uid(),
      text,
      issuedAt: new Date(),
      status: 'isleniyor',
      model: aiOnline ? model : undefined,
      assignments: steps.map((s) => s.assignment),
    };
    setDirectives((prev) => [directive, ...prev]);
    setDraft('');
    syncPipeline(working);
    setPipelineTitle(text);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let previous = '';
    let finalStatus: 'tamamlandi' | 'hata' = 'tamamlandi';

    try {
      for (let i = 0; i < working.length; i++) {
        if (controller.signal.aborted) break;
        patchStep(i, { status: 'calisiyor' });
        const agentId = working[i].assignment.agentId;
        let stepOut = '';
        const append = (t: string) => {
          stepOut += t;
          patchStep(i, { output: stepOut });
        };

        // HERODOT: canlı web proxy → kaynak günlüğü → Ollama analist raporu.
        let liveSources: ResearchSource[] = [];
        let searchLive = false;
        if (agentId === 'herodot') {
          append('[HERODOT] Canlı web araması proxy\'ye iletiliyor (/api/search)…\n');
          try {
            const search = await fetchLiveSources(text, controller.signal);
            liveSources = search.results;
            searchLive = search.live;
            patchStep(i, {
              sources: liveSources,
              searchProvider: search.provider,
              searchLive: search.live,
            });
            for (const line of buildSearchLogLines(text, search)) {
              if (controller.signal.aborted) break;
              append(line + '\n');
              await sleep(120);
            }
          } catch (err) {
            if (controller.signal.aborted) break;
            const msg = err instanceof Error ? err.message : 'Arama başarısız';
            append(`[HERODOT] Proxy hatası: ${msg}\n`);
            // Proxy tamamen erişilemezse boş kaynakla rapora devam et.
            liveSources = [];
            searchLive = false;
            patchStep(i, {
              sources: [],
              searchProvider: 'offline',
              searchLive: false,
            });
            append('[HERODOT] Kaynak olmadan analist çerçevesi üretilecek.\n');
          }
          append('\n');
        }

        if (controller.signal.aborted) {
          patchStep(i, { status: 'tamamlandi' });
          break;
        }

        if (aiOnline) {
          const prompt =
            agentId === 'herodot'
              ? buildResearchPrompt(text, liveSources)
              : buildStepPrompt(working[i], text, previous);
          const stepModel = resolveModel(working[i].engine, installed, model);
          for await (const token of streamGenerate(stepModel, prompt, controller.signal)) {
            append(token);
          }
        } else {
          const sim =
            agentId === 'herodot'
              ? reportFromSources(text, liveSources, searchLive)
              : simulatedStepOutput(agentId, text);
          for (const part of chunked(sim, 18)) {
            if (controller.signal.aborted) break;
            append(part);
            await sleep(28);
          }
        }

        patchStep(i, { status: 'tamamlandi' });
        previous = stepOut;
      }
      updateDirective(directive.id, { status: 'tamamlandi' });
      finalStatus = 'tamamlandi';
    } catch (err) {
      if (controller.signal.aborted) {
        syncPipeline(
          working.map((s) =>
            s.status === 'calisiyor'
              ? { ...s, status: 'tamamlandi', output: `${s.output}\n\n[Akış durduruldu]` }
              : s,
          ),
        );
        updateDirective(directive.id, { status: 'tamamlandi' });
        finalStatus = 'tamamlandi';
      } else {
        const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
        syncPipeline(
          working.map((s) =>
            s.status === 'calisiyor'
              ? { ...s, status: 'hata', output: `${s.output}\n\n[HATA] ${message}` }
              : s,
          ),
        );
        updateDirective(directive.id, { status: 'hata' });
        finalStatus = 'hata';
      }
    } finally {
      // Zincir çıktısını kalıcı arşive yaz (localStorage + sunucu).
      const entry = buildArchiveEntry({
        id: directive.id,
        text: directive.text,
        issuedAt: directive.issuedAt,
        status: finalStatus,
        model: directive.model,
        steps: working,
      });
      setArchive(saveArchiveEntry(entry));
      void syncArchiveToServer(entry);
      setStreaming(false);
      abortRef.current = null;
    }
  };
  issueRef.current = issueDirective;

  const takeFromQueue = async (jobId: string, autoRun: boolean) => {
    if (streaming || claimingId) return;
    setClaimingId(jobId);
    try {
      const { text } = await claimDirective(jobId);
      setReadyJobs((prev) => prev.filter((j) => j.id !== jobId));
      setDraft(text);
      if (autoRun) {
        await issueRef.current(text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  const aiHealth: SystemHealth = aiOnline === null ? 'unknown' : aiOnline ? 'online' : 'offline';
  const completedSteps = pipeline.filter((s) => s.status === 'tamamlandi').length;

  const systemCards: SystemCard[] = [
    {
      title: 'Yerel AI Çekirdeği',
      value: aiOnline ? `${installed.length} model` : 'Simülasyon',
      detail: aiOnline ? 'Ollama servis katmanı aktif' : 'Ollama bağlantısı bekleniyor',
      health: aiHealth,
      icon: Cpu,
    },
    {
      title: 'AI Ajan Filosu',
      value: `${AGENTS.length} ajan`,
      detail: '9 departman · LİKYA-1 orkestrasyonu',
      health: 'online',
      icon: Bot,
    },
    {
      title: 'OlymposPass Ağı',
      value: '1.284 geçiş',
      detail: 'Son 24 saat',
      health: 'online',
      icon: Ticket,
    },
    {
      title: 'Güvenlik Katmanı',
      value: 'Aktif',
      detail: 'Erişim doğrulama servisi',
      health: 'degraded',
      icon: ShieldCheck,
    },
  ];

  const modelOptions = installed.length > 0 ? installed.map((m) => m.name) : [...TARGET_MODELS];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <Activity className="size-6 text-lykia-400" />
          LİKYA CEO Komuta Merkezi
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ekosistemin genel durumu ve otonom talimat yönetimi.
        </p>
      </div>

      {campusPulse && (
        <PanelCard title="Kampüs nabız" className="!py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <span>
              ESG <strong className="text-lykia-200">{campusPulse.pulses?.green?.score ?? '—'}</strong>
            </span>
            <span>
              Kuyruk <strong>{campusPulse.pulses?.queue?.queued ?? 0}</strong>
            </span>
            <span>
              Extreme slot <strong>{campusPulse.pulses?.extreme?.open_slots ?? '—'}</strong>
            </span>
            <span>
              Stay HK <strong>{campusPulse.pulses?.stay?.hk_dirty ?? 0}</strong>
            </span>
            <span>
              Overstay <strong>{campusPulse.pulses?.stay?.overstays_open ?? 0}</strong>
            </span>
            <span>
              WO <strong>{campusPulse.pulses?.campus?.open_work_orders ?? 0}</strong>
            </span>
            <span>
              Köprü <strong>{campusPulse.pulses?.bridge?.alerts_open ?? 0}</strong>
            </span>
            <span>
              Filo{' '}
              <strong>{campusPulse.pulses?.fleet?.shift_active ? 'vardiya' : 'pasif'}</strong>
            </span>
            <span>
              Lease hold <strong>{campusPulse.pulses?.mall?.lease_holds_open ?? 0}</strong>
            </span>
            <span>
              Life flag <strong>{campusPulse.pulses?.life?.flags ?? 0}</strong>
            </span>
            <span>
              Aksiyon <strong>{campusPulse.actions?.length ?? 0}</strong>
            </span>
            <button
              type="button"
              className="ml-auto rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs hover:bg-lykia-500/20"
              onClick={() => {
                window.location.hash = '/campusbrief';
              }}
            >
              CEO Brif →
            </button>
          </div>
        </PanelCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {systemCards.map(({ title, value, detail, health, icon: Icon }) => (
          <PanelCard key={title} className="!p-0">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-lykia-500/10 text-lykia-400">
                <Icon className="size-5" />
              </div>
              <StatusBadge health={health} />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-50">{value}</p>
            <p className="mt-1 text-sm font-medium text-slate-300">{title}</p>
            <p className="text-xs text-slate-500">{detail}</p>
          </PanelCard>
        ))}
      </div>

      {readyJobs.length > 0 && (
        <PanelCard
          title="Kuyruktan Hazır Talimatlar"
          subtitle="Görev Kuyruğu → Komuta köprüsü (AŞAMA 7)"
        >
          <ul className="space-y-2">
            {readyJobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-lykia-500/30 bg-lykia-500/5 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm text-slate-100">
                    <Inbox className="size-3.5 shrink-0 text-lykia-400" />
                    {String(job.payload?.text || job.title)}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                    {job.createdBy} · {new Date(job.dueAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!!claimingId || streaming}
                    onClick={() => void takeFromQueue(job.id, false)}
                    className="rounded-lg border border-obsidian-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-lykia-500/40 hover:text-lykia-300 disabled:opacity-40"
                  >
                    Taslağa Al
                  </button>
                  <button
                    type="button"
                    disabled={!!claimingId || streaming}
                    onClick={() => void takeFromQueue(job.id, true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-lykia-500 px-2.5 py-1.5 text-[11px] font-semibold text-obsidian-950 hover:bg-lykia-400 disabled:opacity-40"
                  >
                    <Play className="size-3" />
                    Al & Çalıştır
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelCard
          title="Otonom Talimat Ekranı"
          subtitle={
            aiOnline
              ? 'Talimat LİKYA-1 tarafından bölünür, zincir yerel modellerle çalışır'
              : 'Ollama çevrimdışı — zincir simülasyon modunda çalışır'
          }
        >
          <div className="mb-3 flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400" htmlFor="model-select">
              Varsayılan model:
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!aiOnline || streaming}
              className="rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-1.5 font-mono text-xs text-lykia-300 focus:border-lykia-500 focus:outline-none disabled:opacity-50"
            >
              {modelOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <StatusBadge
              health={aiHealth}
              label={aiOnline ? 'Canlı AI' : aiOnline === null ? 'Kontrol ediliyor' : 'Simülasyon'}
            />
          </div>

          {playbooks.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Playbook&apos;lar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {playbooks.map((pb) => (
                  <button
                    key={pb.id}
                    type="button"
                    disabled={streaming}
                    onClick={() => setDraft(pb.prompt)}
                    title={pb.prompt}
                    className="rounded-lg border border-obsidian-700 bg-obsidian-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-lykia-500/40 hover:text-lykia-300 disabled:opacity-40"
                  >
                    {pb.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void issueDirective();
            }}
            rows={4}
            placeholder="Örn: OlymposPass için Almanca lansman metni hazırla…"
            className="w-full resize-none rounded-xl border border-obsidian-700 bg-obsidian-950 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-lykia-500 focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void issueDirective()}
              disabled={!draft.trim() || streaming}
              className="inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 transition hover:bg-lykia-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" />
              {streaming ? 'Zincir Çalışıyor…' : 'Talimatı Gönder'}
            </button>
            {streaming && (
              <button
                type="button"
                onClick={stopStreaming}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                <Square className="size-4" />
                Durdur
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-600">
            İpucu: Ctrl/Cmd + Enter ile hızlı gönderim yapabilirsiniz.
          </p>

          <div className="mt-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Talimat Akışı
            </h3>
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {directives.map((d) => {
                const status = STATUS_LABEL[d.status];
                return (
                  <li
                    key={d.id}
                    className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3.5 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-200">{d.text}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatTime(d.issuedAt)}
                          {d.model && <span className="font-mono"> · {d.model}</span>}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    {d.assignments && d.assignments.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          LİKYA-1 zinciri:
                        </span>
                        {d.assignments.map((a, i) => (
                          <span
                            key={a.agentId}
                            title={a.subtask}
                            className="rounded-full bg-lykia-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-lykia-300"
                          >
                            {i + 1}·{a.agentName}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </PanelCard>

        <PanelCard
          title="Ajanlar Arası Üretim Zinciri"
          subtitle="Her ajanın çıktısı bir sonraki ajana girdi olarak devredilir"
          actions={
            streaming ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                ZİNCİR ÇALIŞIYOR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-400">
                <Workflow className="size-3.5" />
                {pipeline.length > 0 ? `${completedSteps}/${pipeline.length} adım` : 'HAZIR'}
              </span>
            )
          }
        >
          {pipeline.length === 0 ? (
            <div className="flex h-100 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-obsidian-700 text-center">
              <Workflow className="size-8 text-slate-700" />
              <p className="max-w-60 text-sm text-slate-500">
                Bir talimat gönderin; LİKYA-1 zinciri kurup ajanları sırayla çalıştırsın.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 truncate rounded-lg bg-obsidian-950/60 px-3 py-2 font-mono text-[11px] text-slate-500">
                Talimat: {pipelineTitle}
              </p>
              <ul className="max-h-120 space-y-2.5 overflow-y-auto pr-1">
                {pipeline.map((step, i) => (
                  <PipelineStepView key={`${step.assignment.agentId}-${i}`} step={step} index={i} />
                ))}
              </ul>
            </>
          )}
        </PanelCard>
      </div>

      <LiveFeed title="Komuta — Canlı Olay Akışı" />

      <ArchivePanel entries={archive} onChange={setArchive} onRestore={restoreArchive} />
    </div>
  );
}
