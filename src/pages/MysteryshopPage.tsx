import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackMysteryshopFlag,
  assignMysteryshopCoach,
  createMysteryshop,
  fetchMysteryshop,
  markMysteryshopLowScoreVisit,
  patchMysteryshop,
  runMysteryshopSweep,
  seedMysteryshopFollowUp,
} from '../services/mysteryshop'

export default function MysteryshopPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"venueId":"venue_olympos_beach","score":"8"})
  async function refresh() {
    try {
      const data = await fetchMysteryshop()
      setRows(data.scores || [])
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance']) if (k in payload) payload[k]=Number(payload[k])||0
      await createMysteryshop(payload)
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Gizli Müşteri</h1>
        <p className="mt-1 text-sm text-slate-400">Mystery shopper skorları.</p>
      </header>
      <CrudOpsBar domain="mysteryshop" onDone={() => void refresh()} />
      {notice && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p>}
      <PanelCard title="Wave 179 ops">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={()=>void runOp('Sweep', () => runMysteryshopSweep({ force: true }))}>Sweep</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={()=>void runOp('Low score', () => markMysteryshopLowScoreVisit({ id: rows[0]?.id }))}>Low score visit</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={()=>void runOp('Assign coach', () => assignMysteryshopCoach({ id: rows[0]?.id }))}>Assign coach</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={()=>void runOp('Seed follow-up', () => seedMysteryshopFollowUp({}))}>Seed follow-up</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-200" onClick={()=>void runOp('Ack', () => ackMysteryshopFlag({ note: 'ui ack' }))}>Flag ack</button>
        </div>
      </PanelCard>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="venueId" value={String(form.venueId??'')} onChange={(e)=>setForm(f=>({...f,venueId:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="score" value={String(form.score??'')} onChange={(e)=>setForm(f=>({...f,score:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.childName||r.code||r.bedNo||r.name||r.holderName||r.room||r.dish||r.metric||r.label||r.route||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.destination||r.reason||r.channel||r.flags||r.tier||r.contact||r.guardian||r.depart||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchMysteryshop(r.id,{status:'scored'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>scored</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchMysteryshop(r.id,{status:'low_score'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>low_score</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchMysteryshop(r.id,{status:'coached'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>coached</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
