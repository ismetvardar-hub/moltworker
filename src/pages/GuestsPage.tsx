import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, UserRound, Users } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  createGuest,
  fetchGuestTimeline,
  fetchGuests,
  syncGuests,
  type Guest,
  type GuestTimelineItem,
} from '../services/guests';

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState({ total: 0, withPass: 0, withPhone: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<GuestTimelineItem[]>([]);
  const [counts, setCounts] = useState({ whatsapp: 0, access: 0 });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchGuests();
      setGuests(data.guests);
      setStats({
        total: data.total,
        withPass: data.withPass,
        withPhone: data.withPhone,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CRM alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openTimeline = async (id: string) => {
    setSelected(id);
    try {
      const data = await fetchGuestTimeline(id);
      setTimeline(data.timeline);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zaman çizelgesi hatası');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGuest({ name: name.trim(), phone: phone.trim() || null });
      setName('');
      setPhone('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Users className="size-6 text-lykia-400" />
            Misafir CRM
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Pass + WhatsApp + geçiş zaman çizelgesi (AŞAMA 17)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void syncGuests().then(() => refresh())}
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 px-4 py-2.5 text-sm font-semibold text-slate-200"
          >
            Senkron
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

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Toplam', stats.total],
          ['Pass bağlı', stats.withPass],
          ['Telefonlu', stats.withPhone],
        ].map(([label, value]) => (
          <PanelCard key={String(label)} className="!p-0">
            <p className="text-2xl font-bold text-slate-50">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </PanelCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Misafirler" subtitle="Tıkla → zaman çizelgesi">
          <form onSubmit={(e) => void submit(e)} className="mb-4 flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad"
              required
              className="min-w-[8rem] flex-1 rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90…"
              className="min-w-[8rem] flex-1 rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-lykia-500 px-4 py-2 text-sm font-semibold text-obsidian-950"
            >
              Ekle
            </button>
          </form>
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {guests.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => void openTimeline(g.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    selected === g.id
                      ? 'border-lykia-500/40 bg-lykia-500/10'
                      : 'border-obsidian-700 bg-obsidian-950/60 hover:border-obsidian-600'
                  }`}
                >
                  <UserRound className="mt-0.5 size-4 shrink-0 text-lykia-400" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-100">{g.name}</span>
                    <span className="block font-mono text-[11px] text-slate-500">
                      {g.passId ?? '—'} · {g.phone ?? 'tel yok'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          title="Zaman Çizelgesi"
          subtitle={
            selected
              ? `WA ${counts.whatsapp} · geçiş ${counts.access}`
              : 'Bir misafir seçin'
          }
        >
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto font-mono text-xs">
            {timeline.length === 0 && (
              <li className="font-sans text-sm text-slate-600">Kayıt yok.</li>
            )}
            {timeline.map((t, i) => (
              <li
                key={`${t.at}-${i}`}
                className="rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
              >
                <div className="flex justify-between gap-2 text-slate-600">
                  <span>{new Date(t.at).toLocaleString('tr-TR')}</span>
                  <span className="text-lykia-300">{t.kind}</span>
                </div>
                <p className="mt-0.5 text-sky-300">{t.title}</p>
                <p className="mt-0.5 font-sans text-[11px] text-slate-400">{t.detail}</p>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
