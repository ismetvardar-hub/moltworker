import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/athleteos'

export default function AthleteosPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchAthleteOs()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kulüp & Sporcu OS</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Lisans · antrenman planı · seans kaydı.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Kadro">
            <p className="text-sm text-slate-300">Aktif {data.summary?.active} · Lisanslı {data.summary?.licensed} · Deneme {data.summary?.trial}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(data.athletes||[]).map((a: any) => (
                <li key={a.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">{a.name} · {a.sport} · {a.level}</li>
              ))}
            </ul>
          </PanelCard>
          <PanelCard title="Haftalık planlar">
            <ul className="space-y-2 text-sm">
              {(data.plans||[]).map((p: any) => (
                <li key={p.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {p.athlete_id} · {p.focus}
                  <div className="text-xs text-slate-500">{(p.sessions||[]).join(' · ')}</div>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-3 rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.upsertAthletePlan({ focus: 'Recovery', sessions: 'Yoga, Nefes' }).then(() => { ping('Plan güncellendi'); return refresh() })}>Recovery planı yaz</button>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
