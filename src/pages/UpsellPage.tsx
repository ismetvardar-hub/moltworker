import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import {
  acceptUpsellOffer,
  ackUpsellFlag,
  ageUpsellPendingOffer,
  createUpsell,
  fetchUpsell,
  patchUpsell,
  runUpsellSweep,
  seedLateCheckoutOffer,
} from '../services/upsell'

export default function UpsellPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>({"offer":"Suite upgrade","guestName":"Misafir"})
  async function refresh() {
    try {
      const data = await fetchUpsell()
      setRows(data.upsell || [])
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
      for (const k of ['qty','value','score','minutes','balance','amount','pax','seats']) if (k in payload) payload[k]=Number(payload[k])||0
      await createUpsell(payload)
      await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Upsell</h1>
        <p className="mt-1 text-sm text-slate-400">Oda/deneyim yükseltme teklifleri.</p>
      </header>
      <CrudOpsBar domain="upsell" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Ops toolbar" subtitle="Wave 166">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runUpsellSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() }).catch((e) => setError(String(e.message || e)))}>Sweep</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackUpsellFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Flag ack</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void ageUpsellPendingOffer({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Offer aged' : r.error || 'Aging yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Age offer</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void acceptUpsellOffer({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Offer accepted' : r.error || 'Accept yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Accept</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={() => void seedLateCheckoutOffer({ guestName: 'Late checkout guest' }).then(() => { ping('Late checkout seed'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Seed late checkout</button>
        </div>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="offer" value={String(form.offer??'')} onChange={(e)=>setForm(f=>({...f,offer:e.target.value}))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="guestName" value={String(form.guestName??'')} onChange={(e)=>setForm(f=>({...f,guestName:e.target.value}))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.guestName||r.offer||r.groupName||r.channel||r.activity||r.bikeNo||r.film||r.sku||r.item||r.slot||r.room||r.metric||r.note||r.code||r.name||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.destination||r.reason||r.until||r.charge||r.note||''}</div>
              </div>
              <div className="flex flex-wrap gap-1"><button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchUpsell(r.id,{status:'offered'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>offered</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchUpsell(r.id,{status:'accepted'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>accepted</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patchUpsell(r.id,{status:'declined'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>declined</button></div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
