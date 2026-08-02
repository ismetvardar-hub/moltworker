import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackGuestappFlag,
  createGuestapp,
  fetchGuestapp,
  markGuestappPushFailure,
  patchGuestapp,
  republishGuestappScreen,
  runGuestappSweep,
  seedWelcomeCard,
} from '../services/guestapp'

export default function GuestappPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"title":"Hoş geldiniz","channel":"push"})
  async function refresh() {
    try {
      const data = await fetchGuestapp()
      setRows(data.guestapp || [])
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats','discount']) if (k in payload) payload[k]=Number(payload[k])||0
      await createGuestapp(payload)
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Misafir App</h1>
        <p className="mt-1 text-sm text-slate-400">Push / in-app bildirim kuyruğu.</p>
      </header>
      <CrudOpsBar domain="guestapp" onDone={() => void refresh()} />
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Wave 174 ops">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={()=>void runOp('Sweep', () => runGuestappSweep({ force: true }))}>Sweep</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={()=>void runOp('Push failure', () => markGuestappPushFailure({}))}>Push failure</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={()=>void runOp('Republish', () => republishGuestappScreen({ screen: 'home' }))}>Republish screen</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={()=>void runOp('Seed welcome', () => seedWelcomeCard({}))}>Seed welcome card</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-200" onClick={()=>void runOp('Ack', () => ackGuestappFlag({ note: 'ui ack' }))}>Flag ack</button>
        </div>
      </PanelCard>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="title" value={String(form.title??'')} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="channel" value={String(form.channel??'')} onChange={(e)=>setForm(f=>({...f,channel:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.room||r.piece||r.arrangement||r.menu||r.drink||r.item||r.code||r.hk||r.time||r.label||r.name||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.channel||r.zone||r.menu||r.until||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchGuestapp(r.id,{status:'queued'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>queued</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchGuestapp(r.id,{status:'sent'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>sent</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchGuestapp(r.id,{status:'failed'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>failed</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
