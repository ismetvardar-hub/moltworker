import { useState } from 'react';
import {
  Activity,
  Bot,
  Cpu,
  Send,
  ShieldCheck,
  Ticket,
  Zap,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import StatusBadge from '../components/StatusBadge';
import type { Directive, SystemHealth } from '../types';

interface SystemCard {
  title: string;
  value: string;
  detail: string;
  health: SystemHealth;
  icon: typeof Cpu;
}

const SYSTEM_CARDS: SystemCard[] = [
  {
    title: 'Yerel AI Çekirdeği',
    value: '3 model',
    detail: 'Ollama servis katmanı',
    health: 'online',
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

const INITIAL_DIRECTIVES: Directive[] = [
  {
    id: 1,
    text: 'OlymposPass giriş kapılarındaki doğrulama gecikmesini analiz et.',
    issuedAt: new Date(Date.now() - 42 * 60_000),
    status: 'tamamlandi',
  },
  {
    id: 2,
    text: 'deepseek-coder ile rezervasyon API taslağını üret.',
    issuedAt: new Date(Date.now() - 11 * 60_000),
    status: 'isleniyor',
  },
];

const STATUS_LABEL: Record<Directive['status'], { label: string; cls: string }> = {
  kuyrukta: { label: 'Kuyrukta', cls: 'bg-slate-500/15 text-slate-300' },
  isleniyor: { label: 'İşleniyor', cls: 'bg-amber-500/15 text-amber-300' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-emerald-500/15 text-emerald-300' },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function CommandCenter() {
  const [directives, setDirectives] = useState<Directive[]>(INITIAL_DIRECTIVES);
  const [draft, setDraft] = useState('');

  const issueDirective = () => {
    const text = draft.trim();
    if (!text) return;
    const directive: Directive = {
      id: Date.now(),
      text,
      issuedAt: new Date(),
      status: 'kuyrukta',
    };
    setDirectives((prev) => [directive, ...prev]);
    setDraft('');

    // Talimat yaşam döngüsü simülasyonu: kuyruk -> işleniyor -> tamamlandı.
    setTimeout(() => {
      setDirectives((prev) =>
        prev.map((d) => (d.id === directive.id ? { ...d, status: 'isleniyor' } : d)),
      );
    }, 1500);
    setTimeout(() => {
      setDirectives((prev) =>
        prev.map((d) => (d.id === directive.id ? { ...d, status: 'tamamlandi' } : d)),
      );
    }, 6500);
  };

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
        {SYSTEM_CARDS.map(({ title, value, detail, health, icon: Icon }) => (
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <PanelCard
          title="Otonom Talimat Ekranı"
          subtitle="Ajan filosuna doğal dilde görev gönderin"
          className="lg:col-span-2"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) issueDirective();
            }}
            rows={5}
            placeholder="Örn: OlymposPass Altın seviye misafirler için VIP kapı akışını hazırla…"
            className="w-full resize-none rounded-xl border border-obsidian-700 bg-obsidian-950 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-lykia-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={issueDirective}
            disabled={!draft.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 transition hover:bg-lykia-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
            Talimatı Gönder
          </button>
          <p className="mt-2 text-[11px] text-slate-600">
            İpucu: Ctrl/Cmd + Enter ile hızlı gönderim yapabilirsiniz.
          </p>
        </PanelCard>

        <PanelCard
          title="Talimat Akışı"
          subtitle="Gönderilen otonom görevlerin canlı durumu"
          className="lg:col-span-3"
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lykia-500/10 px-3 py-1 text-xs font-medium text-lykia-300">
              <Zap className="size-3.5" />
              {directives.length} kayıt
            </span>
          }
        >
          <ul className="space-y-3">
            {directives.map((d) => {
              const status = STATUS_LABEL[d.status];
              return (
                <li
                  key={d.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-slate-200">{d.text}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatTime(d.issuedAt)}</p>
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
        </PanelCard>
      </div>
    </div>
  );
}
