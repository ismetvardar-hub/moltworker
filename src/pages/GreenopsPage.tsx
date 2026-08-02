import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { createGreenops, fetchGreenops, patchGreenops } from '../services/greenops'
export default function GreenopsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"area":"Sahil bahçe","task":"Sulama"})
  async function refresh() {
    try { const data = await fetchGreenops(); setRows(data.greenops || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats','discount','hours','hitRate','load','level','tempC','humidity','ph']) if (k in payload) payload[k]=Number(payload[k])||0
      await createGreenops(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Yeşil Ops</h1>
        <p className="mt-1 text-sm text-slate-400">Yeşil alan bakım.</p>
      </header>
      <CrudOpsBar domain="greenops" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="area" value={String(form.area??'')} onChange={(e)=>setForm(f=>({...f,area:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="task" value={String(form.task??'')} onChange={(e)=>setForm(f=>({...f,task:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.screen||r.point||r.beacon||r.gate||r.unit||r.tank||r.area||r.zone||r.pool||r.cabin||r.room||r.slot||r.therapy||r.name||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.content||r.label||r.event||r.task||r.method||r.chemical||r.ph||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchGreenops(r.id,{status:'planned'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>planned</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchGreenops(r.id,{status:'done'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>done</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchGreenops(r.id,{status:'skipped'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>skipped</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
