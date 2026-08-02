import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { createAsset, fetchAssets, updateAsset, type Asset } from '../services/assets'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [stats, setStats] = useState({ online: 0, maintenance: 0 })
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')

  async function refresh() {
    try {
      const data = await fetchAssets()
      setAssets(data.assets)
      setStats({ online: data.online, maintenance: data.maintenance })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Varlıklar alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createAsset({ name: name.trim(), category })
      setName('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eklenemedi')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Varlıklar</h1>
        <p className="mt-1 text-sm text-slate-400">
          Online {stats.online} · bakım {stats.maintenance}
        </p>
      </header>
      <CrudOpsBar domain="assets" onDone={() => void refresh()} />

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Yeni varlık">
        <form onSubmit={(e) => void onCreate(e)} className="flex flex-wrap gap-3">
          <input
            className="min-w-[200px] flex-1 rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad"
            required
          />
          <input
            className="w-40 rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
          >
            Ekle
          </button>
        </form>
      </PanelCard>
      <PanelCard title={`Envanter (${assets.length})`}>
        <ul className="space-y-2">
          {assets.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium text-slate-100">{a.name}</div>
                <div className="text-xs text-slate-500">
                  {a.category} · {a.serial || '—'} · {a.venueId || 'genel'}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  void updateAsset(a.id, {
                    status: a.status === 'online' ? 'maintenance' : 'online',
                  })
                    .then(() => refresh())
                    .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                }
                className={`rounded-md px-2 py-1 text-xs ${
                  a.status === 'online'
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'bg-amber-500/20 text-amber-200'
                }`}
              >
                {a.status}
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
