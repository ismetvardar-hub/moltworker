import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/lifecoach'

export default function LifecoachPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchLifeCoach()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Yaşam Destek Uzmanı</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Fiziksel · mental · temel + akıllı saat metrikleri.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Bayraklar">
            <p className="text-sm text-amber-200">{data.summary?.flags} dikkat sinyali</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(data.flags||[]).map((m: any) => (
                <li key={m.id} className="rounded-lg border border-amber-500/30 px-3 py-2 text-slate-200">
                  {m.client_id} · recovery {m.recovery} · mood {m.mood} · HRV {m.hrv}
                </li>
              ))}
            </ul>
            <button type="button" className="mt-3 rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.ingestWearable({ recovery: 45, mood: 4, hrv: 48, load: 80 }).then(() => { ping('Saat verisi alındı'); return refresh() })}>Simüle düşük toparlanma</button>
          </PanelCard>
          <PanelCard title="Uzman planı">
            <p className="text-xs text-slate-400">Pillars: {(data.pillars||[]).join(' · ')}</p>
            <button type="button" className="mt-3 rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.createLifePlan({}).then(() => ping('3 sütunlu plan yazıldı'))}>Plan oluştur</button>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
