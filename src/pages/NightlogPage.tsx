import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackNightlogFlag,
  ageNightlogOpenIncident,
  closeNightlogEntry,
  createNightlog,
  fetchNightlog,
  patchNightlog,
  runNightlogSweep,
  seedNightlogSecurityNote,
} from '../services/nightlog'

export default function NightlogPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"metric":"No-show","value":"2"})
  async function refresh() {
    try {
      const data = await fetchNightlog()
      setRows(data.nightlog || [])
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats']) if (k in payload) payload[k]=Number(payload[k])||0
      await createNightlog(payload)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  async function runOp(label: string, fn: () => Promise<any>) {
    try {
      const data = await fn()
      setNotice(data.ok === false ? data.error || `${label} hata` : `${label} OK`)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : `${label} hata`) }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Gece Log</h1>
        <p className="mt-1 text-sm text-slate-400">Night audit operasyon satırları.</p>
      </header>
      <CrudOpsBar domain="nightlog" onDone={() => void refresh()} />
      {notice && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p>}
      <PanelCard title="Wave 179 ops">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={()=>void runOp('Sweep', () => runNightlogSweep({ force: true }))}>Sweep</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={()=>void runOp('Age incident', () => ageNightlogOpenIncident({ id: rows[0]?.id }))}>Open incident aging</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={()=>void runOp('Close entry', () => closeNightlogEntry({ id: rows[0]?.id }))}>Close entry</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={()=>void runOp('Seed security note', () => seedNightlogSecurityNote({}))}>Seed security note</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-200" onClick={()=>void runOp('Ack', () => ackNightlogFlag({ note: 'ui ack' }))}>Flag ack</button>
        </div>
      </PanelCard>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="metric" value={String(form.metric??'')} onChange={(e)=>setForm(f=>({...f,metric:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="value" value={String(form.value??'')} onChange={(e)=>setForm(f=>({...f,value:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.offer||r.groupName||r.channel||r.activity||r.bikeNo||r.film||r.sku||r.item||r.slot||r.room||r.metric||r.note||r.code||r.name||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.destination||r.reason||r.until||r.charge||r.note||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchNightlog(r.id,{status:'open'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>open</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchNightlog(r.id,{status:'closed'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>closed</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
