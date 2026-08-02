import { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, RefreshCw, Trash2 } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import CrudOpsBar from '../components/CrudOpsBar';
import {
  createVenue,
  deleteVenue,
  fetchVenues,
  type Venue,
} from '../services/venues';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, seasonal: 0 });
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchVenues();
      setVenues(data.venues);
      setStats({ total: data.total, active: data.active, seasonal: data.seasonal });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tesisler alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createVenue({ name: name.trim(), region: region.trim(), city: 'Antalya' });
      setName('');
      setRegion('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <MapPin className="size-6 text-lykia-400" />
            Tesisler
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Çoklu locasyon — NEXUS kapıları tesis bazında gruplanır.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200"
        >
          <RefreshCw className="size-4" />
          Yenile
        </button>
      </div>

      <CrudOpsBar domain="venues" onDone={() => void refresh()} />

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Toplam', stats.total],
          ['Aktif', stats.active],
          ['Sezonluk', stats.seasonal],
        ].map(([label, value]) => (
          <PanelCard key={String(label)} className="!p-0">
            <p className="text-2xl font-bold text-slate-50">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </PanelCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Yeni Tesis" subtitle="CEO">
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            <label className="block">
              <span className="text-xs text-slate-400">Ad</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                placeholder="Örn: Lara Beach Gate"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Bölge</span>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                placeholder="Örn: Muratpaşa"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400 disabled:opacity-50"
            >
              <Plus className="size-4" />
              Tesis Ekle
            </button>
          </form>
        </PanelCard>

        <PanelCard title="Tesis Listesi" subtitle="Antalya / Likya operasyon ağı">
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {venues.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">{v.name}</p>
                    <p className="text-xs text-slate-500">
                      {v.city}
                      {v.region ? ` · ${v.region}` : ''} · {v.timezone}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-lykia-300/80">
                      kapılar: {(v.gates ?? []).join(', ') || '—'}
                    </p>
                    {v.notes && <p className="mt-1 text-xs text-slate-400">{v.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-lykia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-lykia-300">
                      {v.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteVenue(v.id).then(() => refresh())}
                      className="inline-flex items-center gap-1 rounded-lg border border-obsidian-700 px-2 py-1 text-[11px] text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Trash2 className="size-3" />
                      Sil
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
