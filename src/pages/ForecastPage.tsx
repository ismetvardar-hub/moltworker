import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { createForecast, fetchForecast, patchForecast } from '../services/forecast'
export default function ForecastPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"metric":"RevPAR","value":"1850"})
  async function refresh() {
    try { const data = await fetchForecast(); setRows(data.forecast || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats','discount','hours']) if (k in payload) payload[k]=Number(payload[k])||0
      await createForecast(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Gelir Forecast</h1>
        <p className="mt-1 text-sm text-slate-400">Haftalık gelir tahmini.</p>
      </header>
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
                {r.title||r.employee||r.name||r.vendor||r.policy||r.project||r.metric||r.area||r.zone||r.breach||r.period||r.item||r.host||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.shift||r.expires||r.renews||r.note||r.host||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchForecast(r.id,{status:'draft'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>draft</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchForecast(r.id,{status:'locked'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>locked</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
