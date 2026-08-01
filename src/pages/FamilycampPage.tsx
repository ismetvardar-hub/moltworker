import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/familycamp'

export default function FamilycampPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchFamilyCamp()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Aile & Çocuk</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Yaz okulu · kamp · güvenli emanet.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Programlar">
            <ul className="space-y-2 text-sm">
              {(data.programs||[]).map((p: any) => (
                <li key={p.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {p.title}
                  <div className="text-xs text-slate-500">{p.booked}/{p.seats} · {p.status}</div>
                </li>
              ))}
            </ul>
          </PanelCard>
          <PanelCard title="Emanet">
            <p className="text-sm text-slate-300">Şu an bakımda: {data.summary?.in_care}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.familyCheckIn({ child_name: 'Ada', guardian: 'Anne' }).then(() => { ping('Emanet check-in'); return refresh() })}>Check-in</button>
              <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.familyCheckOut().then(() => { ping('Teslim edildi'); return refresh() })}>Check-out</button>
            </div>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
