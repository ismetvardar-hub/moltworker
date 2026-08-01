import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/stayring'

export default function StayringPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchStayRing()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Konaklama Halkası</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Glamping · karavan kışlama · bungalow rezervasyon.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Doluluk">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div><dt className="text-xs text-slate-500">Boş</dt><dd className="text-lg text-emerald-300">{data.summary?.free}</dd></div>
              <div><dt className="text-xs text-slate-500">Dolu</dt><dd className="text-lg">{data.summary?.occupied}</dd></div>
              <div><dt className="text-xs text-slate-500">Kışlama</dt><dd>{data.summary?.wintering}</dd></div>
              <div><dt className="text-xs text-slate-500">Hold</dt><dd>{data.summary?.hold}</dd></div>
            </dl>
            <button type="button" className="mt-3 rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.createStayBooking({ nights: 2 }).then(() => { ping('Rezervasyon alındı'); return refresh() })}>Hızlı rezervasyon</button>
          </PanelCard>
          <PanelCard title="Üniteler">
            <ul className="space-y-2 text-sm">
              {(data.units||[]).map((u: any) => (
                <li key={u.id} className="flex justify-between rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  <span>{u.code} · {u.type}</span>
                  <span className="text-xs text-slate-400">{u.status} · {u.rate_try} TRY</span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
