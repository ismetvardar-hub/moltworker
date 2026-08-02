import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackAssetsFlag,
  assignAssetOwner,
  bringAssetOnline,
  createAsset,
  fetchAssets,
  runAssetsSweep,
  scheduleAssetMaintenance,
  updateAsset,
  type Asset,
} from '../services/assets'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [stats, setStats] = useState({ online: 0, maintenance: 0 })
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')

  async function refresh() {
    try {
      const data = await fetchAssets()
      setAssets(data.assets)
      setStats({ online: data.online, maintenance: data.maintenance })
      setOverview(data)
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

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Varlıklar</h1>
        <p className="mt-1 text-sm text-slate-400">
          Online {stats.online} · bakım {stats.maintenance}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      <PanelCard title={overview?.title || 'Varlık ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runAssetsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void scheduleAssetMaintenance({ assignee: 'HEPHAESTUS' }).then((r: any) => { ping(`Scheduled ${r.scheduled?.length ?? 0}`); return refresh() })}>Schedule maintenance</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void bringAssetOnline({}).then((r: any) => { ping(`Online ${r.online?.length ?? 0}`); return refresh() })}>Bring online</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void assignAssetOwner({ assignee: 'Ops owner' }).then((r: any) => { ping(`Assigned ${r.assigned?.length ?? 0}`); return refresh() })}>Assign owner</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackAssetsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · due {overview?.maintenanceDue ?? 0} · offline {overview?.offline ?? 0} · assignee eksik {overview?.missingAssignee ?? 0}
        </p>
      </PanelCard>
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
