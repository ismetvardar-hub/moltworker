import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/agentfleet'

export default function AgentfleetPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [directive, setDirective] = useState('Orman ESG alert ve stay HK temizliği')
  async function refresh() {
    try {
      setData(await api.fetchAgentFleet())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Ajan Filosu</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          28 çekirdek ajan · 9 departman · kampüs uzantıları · {data?.master_rule}
        </p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title="Filo özeti">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Çekirdek</dt>
                <dd className="text-lg text-lykia-200">{data.summary?.total}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Online/busy</dt>
                <dd className="text-lg">{data.summary?.online}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kampüs ops</dt>
                <dd>{data.summary?.campus_ops}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kuyruk</dt>
                <dd>
                  {data.summary?.queue_queued}/{data.summary?.queue_running}
                </dd>
              </div>
            </dl>
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-200"
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-amber-500/25 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runAgentfleetSweep({ force: true, title: directive }).then((r: any) => {
                    ping(r.ok ? `Sweep · ${r.created?.length ?? 0} flag` : r.error || 'Sweep yok')
                    return refresh()
                  })
                }
              >
                Ops sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.ackAgentfleetFlag({ note: 'ui ack' }).then((r: any) => {
                    ping(r.ok ? `Flag ack · ${r.flag?.domain}` : r.error || 'Ack yok')
                    return refresh()
                  })
                }
              >
                Flag ack
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.sweepFleetPresence({ campus_only: true }).then((r: any) => {
                    ping(`Presence ${r.updated} ajan`)
                    return refresh()
                  })
                }
              >
                Kampüs presence sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.dispatchFleetDirective({ title: directive }).then((r: any) => {
                    ping(`Dağıtıldı: ${(r.targets || []).join(', ')}`)
                    return refresh()
                  })
                }
              >
                LİKYA-1 dağıt
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.acknowledgeFleetDirective({ agent: 'REMINDER-AI' }).then((r: any) => {
                    ping(r.ok ? `Ack · ${r.directive?.status}` : r.error || 'Ack yok')
                    return refresh()
                  })
                }
              >
                Direktif ack
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.startFleetShift({ name: 'Kampüs vardiya' }).then((r: any) => {
                    ping(r.ok ? `Vardiya · ${r.shift?.name}` : r.error || 'Vardiya yok')
                    return refresh()
                  })
                }
              >
                Vardiya başlat
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api
                    .handoffFleetShift({ to_lead: 'DAZE-HUB', note: 'CEO handoff' })
                    .then((r: any) => {
                      ping(r.ok ? `Handoff → ${r.handoff?.to_lead}` : r.error || 'Handoff yok')
                      return refresh()
                    })
                }
              >
                Vardiya handoff
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.retireFleetDirective({ reason: 'ops retire' }).then((r: any) => {
                    ping(r.ok ? 'Direktif retired' : r.error || 'Retire yok')
                    return refresh()
                  })
                }
              >
                Direktif retire
              </button>
              <button
                type="button"
                className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100"
                onClick={() =>
                  void api.parkFleetAgent({ agent: 'MINT', minutes: 30 }).then((r: any) => {
                    ping(r.ok ? `Park · ${r.agent}` : r.error || 'Park yok')
                    return refresh()
                  })
                }
              >
                Ajan park
              </button>
              <button
                type="button"
                className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-100"
                onClick={() =>
                  void api.unparkFleetAgents({ force: true }).then((r: any) => {
                    ping(`Unpark ${r.unparked?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                Unpark
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/10 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.runFleetLoadBalance({}).then((r: any) => {
                    ping(r.ok ? `Load-balance seed ${r.seeded?.length ?? 0}` : r.error || 'LB yok')
                    return refresh()
                  })
                }
              >
                Load balance
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-700 px-3 py-2 text-sm text-slate-200"
                onClick={() =>
                  void api.closeFleetShift({ reason: 'ops close' }).then((r: any) => {
                    ping(r.ok ? `Vardiya kapandı · ${r.shift?.name}` : r.error || 'Close yok')
                    return refresh()
                  })
                }
              >
                Vardiya kapat
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Flag {data.summary?.flags_open ?? 0} · stale presence {data.summary?.stale_presence ?? 0} ·{' '}
              Aktif vardiya {data.summary?.shift_active ? 'var' : 'yok'} · açık direktif{' '}
              {data.summary?.directives_open ?? 0} · retired {data.summary?.directives_retired ?? 0} · park{' '}
              {data.summary?.parked ?? 0}
            </p>
          </PanelCard>
          <PanelCard title="Kampüs ajanları">
            <ul className="max-h-80 space-y-2 overflow-auto text-sm">
              {(data.agents || [])
                .filter((a: any) => a.campus)
                .map((a: any) => (
                  <li
                    key={a.code}
                    className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200"
                  >
                    <span>
                      <span className="text-lykia-300">{a.code}</span>
                      <span className="ml-2 text-xs text-slate-500">{a.role}</span>
                    </span>
                    <button
                      type="button"
                      className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]"
                      onClick={() =>
                        void api.pingFleetAgent({ agent: a.code }).then(() => {
                          ping(`${a.code} ping`)
                          return refresh()
                        })
                      }
                    >
                      {a.status}
                    </button>
                  </li>
                ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
