import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackKeycardsFlag,
  createKeycards,
  expireKeycardAccess,
  fetchKeycards,
  patchKeycards,
  reissueKeycard,
  runKeycardsSweep,
  seedLostKeycard,
} from '../services/keycards'

export default function KeycardsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"room":"101","guestName":"Misafir"})
  async function refresh() {
    try {
      const data = await fetchKeycards()
      setRows(data.keycards || [])
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2600)
  }
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats','discount']) if (k in payload) payload[k]=Number(payload[k])||0
      await createKeycards(payload)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Oda Kartı</h1>
        <p className="mt-1 text-sm text-slate-400">Kapı kartı programlama kuyruğu.</p>
      </header>
      <CrudOpsBar domain="keycards" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Ops toolbar" subtitle="Wave 166">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runKeycardsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() }).catch((e) => setError(String(e.message || e)))}>Sweep</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackKeycardsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Flag ack</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void expireKeycardAccess({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Access expired' : r.error || 'Expire yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Expire access</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void reissueKeycard({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Keycard reissued' : r.error || 'Reissue yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Reissue</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={() => void seedLostKeycard({ guestName: 'Lost card guest' }).then(() => { ping('Lost card seed'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Seed lost card</button>
        </div>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="room" value={String(form.room??'')} onChange={(e)=>setForm(f=>({...f,room:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="guestName" value={String(form.guestName??'')} onChange={(e)=>setForm(f=>({...f,guestName:e.target.value}))} />
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
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchKeycards(r.id,{status:'queued'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>queued</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchKeycards(r.id,{status:'encoded'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>encoded</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchKeycards(r.id,{status:'void'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>void</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
