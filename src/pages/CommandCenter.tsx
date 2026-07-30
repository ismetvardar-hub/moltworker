import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bot,
  Cpu,
  Send,
  ShieldCheck,
  Square,
  Terminal,
  Ticket,
  Zap,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import StatusBadge from '../components/StatusBadge';
import {
  TARGET_MODELS,
  checkOllamaStatus,
  isModelInstalled,
  listOllamaModels,
  streamGenerate,
} from '../services/ollama';
import type { Directive, OllamaModel, SystemHealth } from '../types';

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

const SIMULATION_RESPONSE = [
  '// Simülasyon modu — Ollama sunucusuna ulaşılamadı.',
  '// Gerçek AI yanıtı için MacBook üzerinde şunu çalıştırın:',
  '//   OLLAMA_ORIGINS=* ollama serve',
  '',
  'Talimat kuyruğa alındı ve ajan filosuna iletildi.',
].join('\n');

function formatTime(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function CommandCenter() {
  const [directives, setDirectives] = useState<Directive[]>(INITIAL_DIRECTIVES);
  const [draft, setDraft] = useState('');
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [installed, setInstalled] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState<string>(TARGET_MODELS[0]);
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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
          // Varsayılan model: hedef listeden yüklü olan ilk model.
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

  // Akış sırasında çıktı panelini en alta kaydır.
  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [output]);

  const updateDirective = (id: number, patch: Partial<Directive>) => {
    setDirectives((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const issueDirective = async () => {
    const text = draft.trim();
    if (!text || streaming) return;

    const directive: Directive = {
      id: Date.now(),
      text,
      issuedAt: new Date(),
      status: 'kuyrukta',
      model: aiOnline ? model : undefined,
    };
    setDirectives((prev) => [directive, ...prev]);
    setDraft('');

    if (!aiOnline) {
      // Ollama yoksa simülasyon modu: yaşam döngüsü zamanlayıcıyla ilerler.
      setOutput(SIMULATION_RESPONSE);
      setTimeout(() => updateDirective(directive.id, { status: 'isleniyor' }), 1200);
      setTimeout(() => updateDirective(directive.id, { status: 'tamamlandi' }), 5000);
      return;
    }

    // Gerçek AI akışı.
    setStreaming(true);
    setOutput('');
    updateDirective(directive.id, { status: 'isleniyor' });
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for await (const token of streamGenerate(model, text, controller.signal)) {
        setOutput((prev) => prev + token);
      }
      updateDirective(directive.id, { status: 'tamamlandi' });
    } catch (err) {
      if (controller.signal.aborted) {
        setOutput((prev) => `${prev}\n\n[Akış kullanıcı tarafından durduruldu]`);
        updateDirective(directive.id, { status: 'tamamlandi' });
      } else {
        const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
        setOutput((prev) => `${prev}\n\n[HATA] ${message}`);
        updateDirective(directive.id, { status: 'hata' });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const aiHealth: SystemHealth = aiOnline === null ? 'unknown' : aiOnline ? 'online' : 'offline';

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
      value: '4 aktif',
      detail: 'Kod üretimi & operasyon',
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

  const modelOptions =
    installed.length > 0 ? installed.map((m) => m.name) : [...TARGET_MODELS];

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelCard
          title="Otonom Talimat Ekranı"
          subtitle={
            aiOnline
              ? 'Talimatlar yerel Ollama modeline gönderilir'
              : 'Ollama çevrimdışı — talimatlar simülasyon modunda işlenir'
          }
        >
          <div className="mb-3 flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400" htmlFor="model-select">
              Model:
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

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void issueDirective();
            }}
            rows={4}
            placeholder="Örn: OlymposPass için yeni bir Python yetkilendirme fonksiyonu yaz…"
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
              {streaming ? 'Üretiliyor…' : 'Talimatı Gönder'}
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
                    className="flex items-start justify-between gap-3 rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3.5 py-2.5"
                  >
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
                  </li>
                );
              })}
            </ul>
          </div>
        </PanelCard>

        <PanelCard
          title="AI Yanıtı"
          subtitle="Modelin ürettiği yanıt gerçek zamanlı akar"
          actions={
            streaming ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                ÜRETİLİYOR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-400">
                <Zap className="size-3.5" />
                HAZIR
              </span>
            )
          }
        >
          <div className="flex h-120 flex-col overflow-hidden rounded-xl border border-obsidian-700 bg-black/60">
            <div className="flex items-center gap-2 border-b border-obsidian-700 bg-obsidian-900 px-4 py-2.5">
              <Terminal className="size-4 text-lykia-400" />
              <span className="font-mono text-xs text-slate-400">
                likya-ai — {aiOnline ? model : 'simülasyon'}
              </span>
            </div>
            <div
              ref={outputRef}
              className="flex-1 overflow-y-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 text-emerald-200/90"
            >
              {output ||
                (streaming
                  ? 'Model düşünüyor…'
                  : 'Henüz yanıt yok. Soldaki ekrandan bir talimat gönderin.')}
              {streaming && (
                <span className="cursor-blink ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-lykia-400" />
              )}
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
