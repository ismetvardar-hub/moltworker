import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackFleetFlag,
  createFleet,
  dispatchFleetVehicle,
  fetchFleet,
  markFleetServiceDue,
  patchFleet,
  runFleetSweep,
  seedShuttleVan,
} from '../services/fleet'

export default function FleetPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"plate":"07 LYK 01","driver":"Ali"})
  async function refresh() {
    try {
      const data = await fetchFleet()
      setRows(data.fleet || [])
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax']) if (k in payload) payload[k]=Number(payload[k])||0
      await createFleet(payload)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  async function runOp(label: string, fn: () => Promise<any>) {
    try {
      const data = await fn()
      setFlash(data.ok === false ? data.error || `${label} hata` : `${label} OK`)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : `${label} hata`) }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Araç Filosu</h1>
        <p className="mt-1 text-sm text-slate-400">Transfer/vale araç durumu.</p>
      </header>
      <CrudOpsBar domain="fleet" onDone={() => void refresh()} />
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Wave 174 ops">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={()=>void runOp('Sweep', () => runFleetSweep({ force: true }))}>Sweep</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={()=>void runOp('Service due', () => markFleetServiceDue({}))}>Service due</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={()=>void runOp('Dispatch', () => dispatchFleetVehicle({ route: 'Lobby-Airport' }))}>Dispatch vehicle</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={()=>void runOp('Seed shuttle', () => seedShuttleVan({}))}>Seed shuttle van</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-200" onClick={()=>void runOp('Ack', () => ackFleetFlag({ note: 'ui ack' }))}>Flag ack</button>
        </div>
      </PanelCard>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="plate" value={String(form.plate??'')} onChange={(e)=>setForm(f=>({...f,plate:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="driver" value={String(form.driver??'')} onChange={(e)=>setForm(f=>({...f,driver:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.childName||r.code||r.bedNo||r.name||r.holderName||r.room||r.dish||r.metric||r.label||r.route||r.eventName||r.tourName||r.vessel||r.zone||r.plate||r.employee||r.request||r.checkpoint||r.item||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.destination||r.reason||r.channel||r.flags||r.tier||r.contact||r.guardian||r.depart||r.charge||r.slot||r.note||r.driver||r.reading||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchFleet(r.id,{status:'available'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>available</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchFleet(r.id,{status:'on_trip'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>on_trip</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchFleet(r.id,{status:'service'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>service</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
