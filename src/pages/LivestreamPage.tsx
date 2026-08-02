import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { createLivestream, fetchLivestream, patchLivestream } from '../services/livestream'
export default function LivestreamPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"title":"Sunset DJ","platform":"YT"})
  async function refresh() {
    try { const data = await fetchLivestream(); setRows(data.livestream || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','amount','reach','frames']) if (k in payload) payload[k]=Number(payload[k])||0
      await createLivestream(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Canlı Yayın</h1>
        <p className="mt-1 text-sm text-slate-400">Livestream plan / durum.</p>
      </header>
      <CrudOpsBar domain="livestream" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="title" value={String(form.title??'')} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="platform" value={String(form.platform??'')} onChange={(e)=>setForm(f=>({...f,platform:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.asset||r.handle||r.author||r.page||r.campaign||r.target||r.episode||r.subject||r.tag||r.brief||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.channel||r.platform||r.issue||r.message||r.segment||r.owner||r.note||r.until||r.guest||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchLivestream(r.id,{status:'scheduled'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>scheduled</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchLivestream(r.id,{status:'live'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>live</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchLivestream(r.id,{status:'ended'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>ended</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
