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
            <button type="button" className="mt-3 rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.agentBridgePing({ agent: 'DAZE-HUB', note: 'sabah brifing' }).then(() => ping('Ajan ping'))}>Komuta ping</button>
          </PanelCard>
          <PanelCard title="Kampüs nabızları">
            <pre className="overflow-auto rounded-lg bg-obsidian-950 p-3 text-[11px] text-slate-400">{JSON.stringify(data.pulses, null, 2)}</pre>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
