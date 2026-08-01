import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/agentbridge'

export default function AgentbridgePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchAgentBridge()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Ajan Komuta</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">NEXUS · HEPHAESTUS · REMINDER · MINT · DAZE · LIFE-COACH tek nabız.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Ajan filosu">
            <ul className="space-y-2 text-sm">
              {(data.agents||[]).map((a: any) => (
                <li key={a.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
                  <span className="font-semibold text-lykia-200">{a.id}</span>
                  <span className="ml-2 text-xs text-emerald-300">{a.status}</span>
                  <div className="text-xs text-slate-400">{a.role}</div>
                  <div className="text-xs text-slate-500">{a.signal}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.agentBridgePing({ agent: 'DAZE-HUB', note: 'sabah brifing' }).then(() => ping('Ajan ping'))
                }
              >
                Komuta ping
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.agentBridgeBroadcast({ title: 'CEO köprü broadcast' }).then((r: any) => {
                    ping(`Broadcast ${r.broadcast?.targets?.length ?? 0} ajan`)
                    return refresh()
                  })
                }
              >
                Broadcast
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.openAgentBridgeChannel({ topic: 'kampüs-ops' }).then((r: any) => {
                    ping(r.ok ? `Kanal · ${r.channel?.topic}` : r.error || 'Kanal yok')
                    return refresh()
                  })
                }
              >
                Kanal aç
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.pulseAgentBridgeChannel({}).then((r: any) => {
                    ping(`Pulse ×${r.channel?.pulses ?? 0}`)
                    return refresh()
                  })
                }
              >
                Kanal pulse
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api
                    .escalateAgentBridgeAlert({ title: 'ESG kritik', domain: 'green', severity: 'high' })
                    .then((r: any) => {
                      ping(r.ok ? `Alert · ${r.alert?.id}` : r.error || 'Alert yok')
                      return refresh()
                    })
                }
              >
                Alert escalate
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.resolveAgentBridgeAlert({}).then((r: any) => {
                    ping(r.ok ? 'Alert kapandı' : r.error || 'Alert yok')
                    return refresh()
                  })
                }
              >
                Alert kapat
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-700 px-3 py-2 text-sm text-slate-200"
                onClick={() =>
                  void api.closeAgentBridgeChannel({}).then((r: any) => {
                    ping(r.ok ? `Kanal kapandı · ${r.channel?.topic}` : r.error || 'Kanal yok')
                    return refresh()
                  })
                }
              >
                Kanal kapat
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runAgentBridgeAlertSlaSweep({ force: true }).then((r: any) => {
                    ping(`SLA sweep · ${r.sweep?.breached ?? 0}`)
                    return refresh()
                  })
                }
              >
                Alert SLA
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.routeAgentBridgeAlert({ mode: 'work_order' }).then((r: any) => {
                    ping(
                      r.ok
                        ? `Route · ${r.route?.mode}${r.work_order ? ` · ${r.work_order.id}` : ''}`
                        : r.error || 'Route yok',
                    )
                    return refresh()
                  })
                }
              >
                Alert route
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Kanal {data.summary?.channels_open ?? 0} · alert {data.summary?.alerts_open ?? 0} · SLA{' '}
              {data.summary?.alerts_sla_breach ?? 0} · routed {data.summary?.alerts_routed ?? 0}
            </p>
          </PanelCard>
          <PanelCard title="Kampüs nabızları">
            <pre className="overflow-auto rounded-lg bg-obsidian-950 p-3 text-[11px] text-slate-400">{JSON.stringify(data.pulses, null, 2)}</pre>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
