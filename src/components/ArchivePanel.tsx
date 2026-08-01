import { useMemo, useState } from 'react';
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Search,
  Trash2,
} from 'lucide-react';
import PanelCard from './PanelCard';
import {
  clearArchive,
  deleteArchiveEntry,
  exportArchiveJson,
  exportEntryJson,
  filterArchive,
  type ArchiveEntry,
} from '../services/archive';

interface ArchivePanelProps {
  entries: ArchiveEntry[];
  onChange: (entries: ArchiveEntry[]) => void;
  onRestore?: (entry: ArchiveEntry) => void;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ArchivePanel({ entries, onChange, onRestore }: ArchivePanelProps) {
  const [query, setQuery] = useState('');
  const [agent, setAgent] = useState('all');
  const [status, setStatus] = useState<'all' | 'tamamlandi' | 'hata'>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const agentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) for (const a of e.agents) set.add(a);
    return [...set].sort();
  }, [entries]);

  const filtered = useMemo(
    () => filterArchive(entries, { query, agent: agent === 'all' ? undefined : agent, status }),
    [entries, query, agent, status],
  );

  const remove = (id: number) => {
    onChange(deleteArchiveEntry(id));
    if (openId === id) setOpenId(null);
  };

  const wipe = () => {
    if (!entries.length) return;
    if (!confirm(`${entries.length} arşiv kaydı silinecek. Emin misiniz?`)) return;
    clearArchive();
    onChange([]);
    setOpenId(null);
  };

  return (
    <PanelCard
      title="Talimat Hafızası & Zincir Arşivi"
      subtitle="Tamamlanan görevler localStorage'da saklanır · JSON dışa aktarma destekli"
      actions={
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-300">
            <Archive className="mr-1 inline size-3.5" />
            {filtered.length}/{entries.length}
          </span>
          <button
            type="button"
            disabled={!filtered.length}
            onClick={() => exportArchiveJson(filtered)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-700 bg-obsidian-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-lykia-500/40 hover:text-lykia-300 disabled:opacity-40"
          >
            <Download className="size-3.5" />
            JSON Aktar
          </button>
          <button
            type="button"
            disabled={!entries.length}
            onClick={wipe}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
          >
            <Trash2 className="size-3.5" />
            Temizle
          </button>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="relative block sm:col-span-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Metin, ajan veya çıktıda ara…"
            className="w-full rounded-xl border border-obsidian-700 bg-obsidian-950 py-2 pr-3 pl-9 text-sm text-slate-200 placeholder:text-slate-600 focus:border-lykia-500 focus:outline-none"
          />
        </label>
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-200 focus:border-lykia-500 focus:outline-none"
        >
          <option value="all">Tüm ajanlar</option>
          {agentOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | 'tamamlandi' | 'hata')}
          className="rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-200 focus:border-lykia-500 focus:outline-none"
        >
          <option value="all">Tüm durumlar</option>
          <option value="tamamlandi">Tamamlandı</option>
          <option value="hata">Hata</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-obsidian-700 px-4 py-10 text-center text-sm text-slate-600">
          {entries.length === 0
            ? 'Henüz arşiv kaydı yok. Bir talimat zinciri tamamlandığında burada saklanır.'
            : 'Filtrelere uyan kayıt bulunamadı.'}
        </div>
      ) : (
        <ul className="max-h-120 space-y-2 overflow-y-auto pr-1">
          {filtered.map((entry) => {
            const open = openId === entry.id;
            return (
              <li
                key={entry.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60"
              >
                <div className="flex items-start gap-2 px-3.5 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : entry.id)}
                    className="mt-0.5 shrink-0 text-slate-500 hover:text-lykia-300"
                    aria-label={open ? 'Kapat' : 'Aç'}
                  >
                    {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : entry.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm text-slate-100">{entry.text}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatWhen(entry.completedAt)}
                      {entry.model && <span className="font-mono"> · {entry.model}</span>}
                      <span> · {entry.steps.length} adım</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {entry.agents.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-lykia-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-lykia-300"
                        >
                          {a}
                        </span>
                      ))}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          entry.status === 'tamamlandi'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {entry.status === 'tamamlandi' ? 'Tamamlandı' : 'Hata'}
                      </span>
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      title="JSON indir"
                      onClick={() => exportEntryJson(entry)}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-obsidian-800 hover:text-lykia-300"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Sil"
                      onClick={() => remove(entry.id)}
                      className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="space-y-2 border-t border-obsidian-700/60 px-3.5 py-3">
                    {onRestore && (
                      <button
                        type="button"
                        onClick={() => onRestore(entry)}
                        className="mb-1 text-xs font-semibold text-sky-300 hover:underline"
                      >
                        Bu zinciri üretim kartında yeniden görüntüle
                      </button>
                    )}
                    {entry.steps.map((step, i) => (
                      <div
                        key={`${step.agentId}-${i}`}
                        className="rounded-lg border border-obsidian-700 bg-black/40 p-3"
                      >
                        <p className="text-xs font-semibold text-slate-200">
                          {i + 1}. {step.agentName}
                          <span className="ml-2 font-mono font-normal text-slate-600">
                            {step.engine}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">{step.subtask}</p>
                        {step.output && (
                          <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-emerald-200/80">
                            {step.output}
                          </pre>
                        )}
                        {step.sources && step.sources.length > 0 && (
                          <ul className="mt-2 space-y-1.5">
                            {step.sources.map((s) => (
                              <li key={s.url}>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-sky-300 hover:underline"
                                >
                                  <ExternalLink className="size-3" />
                                  {s.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
}
