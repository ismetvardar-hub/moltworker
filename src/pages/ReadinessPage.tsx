import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/readiness'

export default function ReadinessPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchReadiness())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    }
  }
  useEffect(() => {
    void refresh()
  }, [])
  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Hazırlık Skoru</h1>
        <p className="mt-1 text-sm text-slate-400">
          AŞAMA 60 + kampüs nabız (ESG · ajan kuyruk · campus health).
        </p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      {data && (
        <>
          <PanelCard title={data.title || `Skor ${data.overall} · ${data.grade}`}>
            {(data.summaryLines || []).length > 0 && (
              <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {(data.summaryLines || []).map((l: string) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.runReadinessSweep({ force: true }).then((r: any) => {
                    ping(`Sweep +${r.created?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                Sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.refreshReadinessSnapshot({ note: 'ops snapshot' }).then((r: any) => {
                    ping(`Snapshot · ${r.snapshot?.overall}`)
                    return refresh()
                  })
                }
              >
                Snapshot
              </button>
              <button
                type="button"
                className="rounded-lg bg-teal-500/20 px-3 py-2 text-sm text-teal-100"
                onClick={() =>
                  void api.setReadinessThreshold({ warn: 72, alert: 58, critical: 42 }).then((r: any) => {
                    ping(`Eşik warn ${r.thresholds?.warn}`)
                    return refresh()
                  })
                }
              >
                Eşik ayarla
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.escalateReadinessGap({ reason: 'ops gap' }).then((r: any) => {
                    ping(r.ok ? `Gap · ${r.dimension?.label}` : r.error || 'Gap yok')
                    return refresh()
                  })
                }
              >
                Gap escalate
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.resolveReadinessGap({}).then((r: any) => {
                    ping(r.ok ? 'Gap resolved' : r.error || 'Resolve yok')
                    return refresh()
                  })
                }
              >
                Gap resolve
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.ackReadinessDimension({}).then((r: any) => {
                    ping(r.ok ? `Ack · ${r.dimension?.label}` : r.error || 'Ack yok')
                    return refresh()
                  })
                }
              >
                Boyut ack
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-700 px-3 py-2 text-sm"
                onClick={() =>
                  void api.ackReadinessFlag({}).then((r: any) => {
                    ping(r.ok ? 'Flag ack' : r.error || 'Ack yok')
                    return refresh()
                  })
                }
              >
                Flag ack
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {(data.dimensions || []).map((d: any) => (
                <div key={d.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-100">
                      {d.label} · {d.score}
                      {d.level && d.level !== 'ok' ? (
                        <span className="ml-1 text-[10px] text-amber-300">{d.level}</span>
                      ) : null}
                      {d.acked ? <span className="ml-1 text-[10px] text-emerald-300">ack</span> : null}
                    </div>
                    <button
                      type="button"
                      className="rounded bg-obsidian-800 px-2 py-0.5 text-[10px] text-slate-300"
                      onClick={() =>
                        void api.ackReadinessDimension({ id: d.id }).then(() => {
                          ping('Ack')
                          return refresh()
                        })
                      }
                    >
                      Ack
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">{d.detail}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Flag {data.summary?.flags_open ?? 0} · warn {data.summary?.dims_warn ?? 0} · alert{' '}
              {data.summary?.dims_alert ?? 0} · gap {data.summary?.gaps_open ?? 0} · snapshot{' '}
              {data.summary?.snapshots ?? 0} · eşik warn {data.thresholds?.warn ?? 70}
            </p>
            {data.signals?.campusScore != null && (
              <p className="mt-1 text-xs text-slate-500">
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
