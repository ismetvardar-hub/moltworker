import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/campuscore'

export default function CampuscorePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchCampusCore()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kampüs Omurga</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Arazi zonları — spor, konaklama, AVM, kültür, orman koruma.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Özet">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div><dt className="text-xs text-slate-500">Toplam ha</dt><dd className="text-lg text-lykia-200">{data.summary?.total_ha}</dd></div>
              <div><dt className="text-xs text-slate-500">Aktif zon</dt><dd className="text-lg">{data.summary?.active}</dd></div>
              <div><dt className="text-xs text-slate-500">İnşaat</dt><dd>{data.summary?.build}</dd></div>
              <div><dt className="text-xs text-slate-500">Koruma</dt><dd>{data.summary?.protected}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">{data.ethos}</p>
          </PanelCard>
          <PanelCard title="Zonlar">
            <ul className="space-y-2 text-sm">
              {(data.zones||[]).map((z: any) => (
                <li key={z.id} className="flex justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
                  <span className="text-slate-200">{z.name}<span className="ml-2 text-xs text-slate-500">{z.hectares} ha · {z.kind}</span></span>
                  <span className="text-xs text-lykia-300">{z.status}</span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
