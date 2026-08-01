import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/circuit2'
export default function Circuit2Page() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() { try { setData(await api.fetchCircuit2()); setError(null) } catch (e) { setError(e instanceof Error ? e.message : 'Hata') } }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Circuit2</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA 990 — platform · API · runtime özeti.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title={data.title}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{(data.summaryLines || []).map((l: string) => (<li key={l}>{l}</li>))}</ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runCircuit2Sweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
              <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.busyCircuit2Moment({}).then((r: any) => { ping(`Moment ${r.busied?.length ?? 0}`); return refresh() })}>Moment busy</button>
              <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.closeCircuit2Hook({}).then((r: any) => { ping(`Hook ${r.closed?.length ?? 0}`); return refresh() })}>Hook close</button>
              <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.liveCircuit2Schema({}).then((r: any) => { ping(`Schema ${r.lived?.length ?? 0}`); return refresh() })}>Schema live</button>
              <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackCircuit2Flag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Flag {data.summary?.flags_open ?? 0} · moment {data.summary?.moment_idle ?? 0} · hook {data.summary?.hook_open ?? 0} · schema {data.summary?.schema_draft ?? 0}</p>
          </PanelCard>
          <PanelCard title="Açık flagler">
            <ul className="space-y-2 text-sm">
              {(data.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
              {(data.flags || []).slice(0, 10).map((f: any) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                  <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                  <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackCircuit2Flag({ id: f.id }).then(() => { ping('Ack'); return refresh() })}>Ack</button>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
