import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchReadiness } from '../services/readiness'

export default function ReadinessPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void fetchReadiness().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
  }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Hazırlık Skoru</h1>
        <p className="mt-1 text-sm text-slate-400">
          AŞAMA 60 + kampüs nabız (ESG · ajan kuyruk · campus health).
        </p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <>
          <PanelCard title={`Skor ${data.overall} · ${data.grade}`}>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {(data.dimensions || []).map((d: any) => (
                <div key={d.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-sm">
                  <div className="font-medium text-slate-100">
                    {d.label} · {d.score}
                  </div>
                  <div className="text-xs text-slate-500">{d.detail}</div>
                </div>
              ))}
            </div>
            {data.signals?.campusScore != null && (
              <p className="mt-3 text-xs text-slate-500">
                Kampüs {data.signals.campusStatus} · skor {data.signals.campusScore} · kuyruk{' '}
                {data.signals.queueQueued} · ESG {data.signals.esgScore}
              </p>
            )}
          </PanelCard>
        </>
      )}
    </div>
  )
}
