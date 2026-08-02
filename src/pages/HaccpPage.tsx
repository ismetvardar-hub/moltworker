import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackHaccpFlag,
  createHaccp,
  fetchHaccp,
  logHaccpCorrective,
  markHaccpTempBreach,
  patchHaccp,
  runHaccpSweep,
  seedProbeCheck,
} from '../services/haccp'

export default function HaccpPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"checkpoint":"Soğuk oda","reading":"4C"})
  async function refresh() {
    try {
      const data = await fetchHaccp()
      setRows(data.haccp || [])
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2600)
  }
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax']) if (k in payload) payload[k]=Number(payload[k])||0
      await createHaccp(payload)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">HACCP</h1>
        <p className="mt-1 text-sm text-slate-400">Gıda güvenliği kayıtları.</p>
      </header>
      <CrudOpsBar domain="haccp" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Ops toolbar" subtitle="Wave 171">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runHaccpSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() }).catch((e) => setError(String(e.message || e)))}>Sweep</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackHaccpFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Flag ack</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void markHaccpTempBreach({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Temp breach' : r.error || 'Breach yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Temp breach</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void logHaccpCorrective({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Corrective logged' : r.error || 'Corrective yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Log corrective</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={() => void seedProbeCheck({ checkpoint: 'Probe check' }).then(() => { ping('Probe check seed'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Seed probe check</button>
        </div>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="checkpoint" value={String(form.checkpoint??'')} onChange={(e)=>setForm(f=>({...f,checkpoint:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="reading" value={String(form.reading??'')} onChange={(e)=>setForm(f=>({...f,reading:e.target.value}))} />
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
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHaccp(r.id,{status:'pass'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>pass</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHaccp(r.id,{status:'fail'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>fail</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHaccp(r.id,{status:'pending'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>pending</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
