import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchWarroom } from '../services/warroom'
export default function WarroomPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { void fetchWarroom().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Hata')) }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">War Room</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA 105 — gelir · uyum · saha komuta özeti.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <PanelCard title={data.title}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(data.summaryLines||[]).map((l:string)=><li key={l}>{l}</li>)}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Hazırlık {data.boardpack?.readiness?.overall} · {data.boardpack?.readiness?.grade}</p>
        </PanelCard>
      )}
    </div>
  )
}
