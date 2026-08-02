import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { createMinibarbay, fetchMinibarbay, patchMinibarbay } from '../services/minibarbay'
export default function MinibarbayPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"room":"412","sku":"Water"})
  async function refresh() {
    try { const data = await fetchMinibarbay(); setRows(data.minibarbay || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','amount','price','points','limit','ms','pct','count','level']) if (k in payload) payload[k]=Number(payload[k])||0
      await createMinibarbay(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Minibar Bay</h1>
        <p className="mt-1 text-sm text-slate-400">Minibar dolum istasyonu.</p>
      </header>
      <CrudOpsBar domain="minibarbay" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="room" value={String(form.room??'')} onChange={(e)=>setForm(f=>({...f,room:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="sku" value={String(form.sku??'')} onChange={(e)=>setForm(f=>({...f,sku:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.name||r.guestName||r.label||r.code||r.zone||r.sku||r.metric||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.note||r.detail||r.channel||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchMinibarbay(r.id,{status:'due'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>due</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchMinibarbay(r.id,{status:'restocked'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>restocked</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchMinibarbay(r.id,{status:'billed'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>billed</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
