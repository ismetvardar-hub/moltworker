import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { createBrand, fetchBrands, type Brand } from '../services/brands';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActive] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchBrands();
      setBrands(data.brands);
      setActive(data.activeBrandId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Markalar alınamadı');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createBrand({ name: name.trim(), modules: ['hub'], venueIds: [] });
      setName('');
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
            <Building2 className="size-6 text-lykia-400" />
            Markalar / Kiracılar
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Holding altında ürün markaları · modül ve tesis kapsamı (AŞAMA 16)
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

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard title="Marka Listesi" subtitle={`Aktif oturum: ${activeBrandId ?? '—'}`}>
          <ul className="space-y-2">
            {brands.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-lg text-xs font-bold text-obsidian-950"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.shortName.slice(0, 3)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-100">{b.name}</p>
                    <p className="truncate font-mono text-[11px] text-slate-500">
                      {(b.modules ?? []).join(' · ') || 'modül yok'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {(b.venueIds ?? []).length} tesis
                    </p>
                  </div>
                  {activeBrandId === b.id && (
                    <span className="rounded-full bg-lykia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-lykia-300">
                      seçili
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Yeni Marka" subtitle="CEO">
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marka adı"
              className="w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2.5 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950"
            >
              <Plus className="size-4" />
              Marka Ekle
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            Sol menüdeki marka seçici ile aktif markayı değiştirin; menü modülleri buna göre süzülür.
          </p>
        </PanelCard>
      </div>
    </div>
  );
}
