import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchDigest } from '../services/digest'

export default function DigestPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void fetchDigest().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
  }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">CEO Digest</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA 75 — yönetici özeti.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <>
          <PanelCard title={`Hazırlık ${data.readiness?.overall} · ${data.readiness?.grade}`}>
            <ul className="list-disc pl-5 text-sm text-slate-300">
              {(data.headlines || []).map((h: string) => <li key={h}>{h}</li>)}
            </ul>
            <p className="mt-3 text-sm text-lykia-300">{data.weather?.label} · {data.weather?.tempC}°C — {data.weather?.tip}</p>
            <p className="mt-2 text-xs text-slate-500">NPS {data.nps ?? '—'} · kasa {data.cashBalance} · bahşiş {data.tipBalance}</p>
          </PanelCard>
          <PanelCard title="Boyutlar">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {(data.dimensions || []).map((d: any) => (
                <div key={d.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-sm">
                  <div className="text-slate-100">{d.label} · {d.score}</div>
                  <div className="text-xs text-slate-500">{d.detail}</div>
                </div>
              ))}
            </div>
          </PanelCard>
        </>
      )}
    </div>
  )
}
