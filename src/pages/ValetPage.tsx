import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackValetFlag,
  createValet,
  deliverValetVehicle,
  fetchValet,
  patchValet,
  requestValetPickup,
  runValetSweep,
  seedLongParkedValetTicket,
} from '../services/valet'

export default function ValetPage() {
  const [rows, setRows] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string | number>>({"plate":"07 TEST 01","guestName":"Misafir","spot":"V-1"})

  async function refresh() {
    try {
      const data = await fetchValet()
      setRows(data.tickets || [])
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }

  useEffect(() => { void refresh() }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      
      await createValet(payload)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Vale / Otopark</h1>
        <p className="mt-1 text-sm text-slate-400">
          Plaka fişleri ve teslim · parked {overview?.parked ?? 0} · requested {overview?.requested ?? 0}
        </p>
      </header>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title={overview?.title || 'Vale ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runValetSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void requestValetPickup({ minutes: 20 }).then((r: any) => { ping(`Requested ${r.requested?.length ?? 0}`); return refresh() })}>Request pickup</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void deliverValetVehicle({}).then((r: any) => { ping(`Delivered ${r.delivered?.length ?? 0}`); return refresh() })}>Deliver</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void seedLongParkedValetTicket({}).then((r: any) => { ping(r.ticket ? 'Long parked seed' : 'Seed yok'); return refresh() })}>Seed long parked</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackValetFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · long parked {overview?.parkedTooLong ?? 0} · plakasız {overview?.ticketWithoutPlate ?? 0} · pickup aging {overview?.readyForPickupAging ?? 0}
        </p>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="plate" value={form.plate} onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="guestName" value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="spot" value={form.spot} onChange={(e) => setForm((f) => ({ ...f, spot: e.target.value }))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id || r.venueId || r.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.name || r.title || r.plate || r.guestName || r.item || r.label || r.subject || r.toPerson || r.supplierName || r.venueId}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                {r.overall != null ? <span className="ml-2 text-xs text-lykia-300">ort {r.overall}</span> : null}
                {r.open && r.close ? <span className="ml-2 text-xs text-slate-500">{r.open}–{r.close}</span> : null}
                <div className="text-xs text-slate-500">{r.note || r.body || r.message || r.artist || r.spot || r.reason || ''}</div>
              </div>
              <div className="flex gap-1">
                
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                  onClick={() => void patchValet(r.id, { status: 'parked' }).then(() => refresh()).catch((e) => setError(String(e.message||e)))}>parked</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                  onClick={() => void patchValet(r.id, { status: 'requested' }).then(() => refresh()).catch((e) => setError(String(e.message||e)))}>requested</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                  onClick={() => void patchValet(r.id, { status: 'delivered' }).then(() => refresh()).catch((e) => setError(String(e.message||e)))}>delivered</button>
                
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
