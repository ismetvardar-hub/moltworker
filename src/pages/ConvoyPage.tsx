import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/convoy'
export default function ConvoyPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() { try { setData(await api.fetchConvoy()); setError(null) } catch (e) { setError(e instanceof Error ? e.message : 'Hata') } }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Convoy</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA 600 — mobilite · filo · curb.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title={data.title}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{(data.summaryLines || []).map((l: string) => (<li key={l}>{l}</li>))}</ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runConvoySweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
              <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.clearConvoyDispatch({}).then((r: any) => { ping(`Dispatch ${r.cleared?.length ?? 0}`); return refresh() })}>Dispatch clear</button>
              <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.readyConvoyFleet({}).then((r: any) => { ping(`Fleet ${r.readied?.length ?? 0}`); return refresh() })}>Fleet ready</button>
              <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.freeConvoyCurb({}).then((r: any) => { ping(`Curb ${r.freed?.length ?? 0}`); return refresh() })}>Curb free</button>
              <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackConvoyFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Flag {data.summary?.flags_open ?? 0} · dispatch {data.summary?.disp_queued ?? 0} · fleet {data.summary?.fleet_service ?? 0} · gps {data.summary?.gps_offline ?? 0}</p>
          </PanelCard>
          <PanelCard title="Açık flagler">
            <ul className="space-y-2 text-sm">
              {(data.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
              {(data.flags || []).slice(0, 10).map((f: any) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                  <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                  <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackConvoyFlag({ id: f.id }).then(() => { ping('Ack'); return refresh() })}>Ack</button>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
