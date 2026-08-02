import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { createHelipad, fetchHelipad, patchHelipad } from '../services/helipad'
export default function HelipadPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"slot":"H1","flight":"VIP-01"})
  async function refresh() {
    try { const data = await fetchHelipad(); setRows(data.helipad || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats','discount','hours','hitRate','load','level','tempC','humidity','ph','credits','buyin','teams']) if (k in payload) payload[k]=Number(payload[k])||0
      await createHelipad(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Helipad</h1>
        <p className="mt-1 text-sm text-slate-400">Helikopter iniş slotları.</p>
      </header>
      <CrudOpsBar domain="helipad" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="slot" value={String(form.slot??'')} onChange={(e)=>setForm(f=>({...f,slot:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="flight" value={String(form.flight??'')} onChange={(e)=>setForm(f=>({...f,flight:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.vessel||r.unit||r.slot||r.board||r.lane||r.room||r.machine||r.table||r.theme||r.dj||r.stage||r.flight||r.level||r.name||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.note||r.flight||r.slot||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHelipad(r.id,{status:'open'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>open</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHelipad(r.id,{status:'booked'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>booked</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHelipad(r.id,{status:'closed'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>closed</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
