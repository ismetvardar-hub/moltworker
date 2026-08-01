import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchVanguard } from '../services/vanguard'
export default function VanguardPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { void fetchVanguard().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Hata')) }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Vanguard</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA 330 — Nexus Prime · omni-kanal & otonom ticaret özeti.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <PanelCard title={data.title}>
          {data.subtitle ? <p className="mb-2 text-xs text-slate-500">{data.subtitle}</p> : null}
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(data.summaryLines||[]).map((l:string)=><li key={l}>{l}</li>)}
          </ul>
        </PanelCard>
      )}
    </div>
  )
}
