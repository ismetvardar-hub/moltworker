import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { createHallucheck, fetchHallucheck, patchHallucheck } from '../services/hallucheck'
export default function HallucheckPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"agent":"BABEL","sample":"Çıktı-1"})
  async function refresh() {
    try { const data = await fetchHallucheck(); setRows(data.hallucheck || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','limit','docs','rows','p95ms','spend','ms','delta']) if (k in payload) payload[k]=Number(payload[k])||0
      await createHallucheck(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Hallucination Check</h1>
        <p className="mt-1 text-sm text-slate-400">Halüsinasyon denetim satırları.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="agent" value={String(form.agent??'')} onChange={(e)=>setForm(f=>({...f,agent:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="sample" value={String(form.sample??'')} onChange={(e)=>setForm(f=>({...f,sample:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.name||r.model||r.agent||r.corpus||r.tool||r.scenario||r.sample||r.suite||r.service||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.version||r.severity||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHallucheck(r.id,{status:'clean'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>clean</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHallucheck(r.id,{status:'flagged'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>flagged</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchHallucheck(r.id,{status:'blocked'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>blocked</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
