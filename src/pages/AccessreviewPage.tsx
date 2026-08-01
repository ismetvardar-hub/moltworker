import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { createAccessreview, fetchAccessreview, patchAccessreview } from '../services/accessreview'
export default function AccessreviewPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"user":"crew1","system":"Komuta"})
  async function refresh() {
    try { const data = await fetchAccessreview(); setRows(data.accessreview || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','tco2e','m3','aqi','kwh','kg','months','amount']) if (k in payload) payload[k]=Number(payload[k])||0
      await createAccessreview(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Erişim Gözden Geçir</h1>
        <p className="mt-1 text-sm text-slate-400">Rol/erişim periyodik review.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="user" value={String(form.user??'')} onChange={(e)=>setForm(f=>({...f,user:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="system" value={String(form.system??'')} onChange={(e)=>setForm(f=>({...f,system:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.name||r.source||r.zone||r.array||r.species||r.material||r.finding||r.policy||r.request||r.dataset||r.user||r.vendor||r.matter||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.note||r.subject||r.employee||r.scope||r.severity||r.system||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchAccessreview(r.id,{status:'pending'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>pending</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchAccessreview(r.id,{status:'approved'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>approved</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchAccessreview(r.id,{status:'revoked'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>revoked</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
