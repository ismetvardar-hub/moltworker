import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchCrown } from '../services/crown'
export default function CrownPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { void fetchCrown().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Hata')) }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Crown</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA 555 — sadakat · VIP · geri bildirim özeti.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <PanelCard title={data.title}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(data.summaryLines||[]).map((l:string)=><li key={l}>{l}</li>)}
          </ul>
        </PanelCard>
      )}
    </div>
  )
}
