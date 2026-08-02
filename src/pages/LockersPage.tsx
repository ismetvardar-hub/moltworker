import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  ackLockersFlag,
  createLockers,
  fetchLockers,
  markLockersOverdueRental,
  patchLockers,
  releaseLocker,
  runLockersSweep,
  seedLockerDayPass,
} from '../services/lockers'

export default function LockersPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"code":"L-01","guestName":"Misafir"})
  async function refresh() {
    try {
      const data = await fetchLockers()
      setRows(data.lockers || [])
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
      for (const k of ['qty','value','score','minutes','balance']) if (k in payload) payload[k]=Number(payload[k])||0
      await createLockers(payload)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Dolap Kiralama</h1>
        <p className="mt-1 text-sm text-slate-400">Spa/plaj dolapları.</p>
      </header>
      <CrudOpsBar domain="lockers" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Ops toolbar" subtitle="Wave 172">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runLockersSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() }).catch((e) => setError(String(e.message || e)))}>Sweep</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackLockersFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Flag ack</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void markLockersOverdueRental({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Overdue rental' : r.error || 'Overdue yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Overdue rental</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void releaseLocker({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Locker released' : r.error || 'Release yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Release locker</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={() => void seedLockerDayPass({ code: 'DP-72' }).then(() => { ping('Day pass seed'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Seed day pass</button>
        </div>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="code" value={String(form.code??'')} onChange={(e)=>setForm(f=>({...f,code:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="guestName" value={String(form.guestName??'')} onChange={(e)=>setForm(f=>({...f,guestName:e.target.value}))} />
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
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchLockers(r.id,{status:'free'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>free</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchLockers(r.id,{status:'occupied'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>occupied</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchLockers(r.id,{status:'hold'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>hold</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
