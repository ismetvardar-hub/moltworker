import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/maintenance'
import type { MaintenanceTicket } from '../services/maintenance'

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [open, setOpen] = useState(0)
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [asset, setAsset] = useState('')
  const [priority, setPriority] = useState('medium')

  async function refresh() {
    try {
      const data = await api.fetchMaintenance()
      setTickets(data.tickets)
      setOpen(data.open)
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ticketlar alınamadı')
    }
  }

  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await api.createTicket({ title: title.trim(), asset, priority })
      setTitle('')
      setAsset('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Bakım Ticket</h1>
        <p className="mt-1 text-sm text-slate-400">Açık {open} — arıza / bakım kuyruğu.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={overview?.title || 'Bakım ops'}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{(overview?.summaryLines || []).map((l: string) => (<li key={l}>{l}</li>))}</ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runMaintenanceSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
            <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.closeCriticalMaintenance({}).then((r: any) => { ping(`Critical ${r.closed?.length ?? 0}`); return refresh() })}>Critical close</button>
            <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.escalateOverdueMaintenance({}).then((r: any) => { ping(`Escalate ${r.escalated?.length ?? 0}`); return refresh() })}>Escalate overdue</button>
            <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.createPreventiveMaintenance({}).then((r: any) => { ping(`Preventive ${r.ticket?.id || ''}`); return refresh() })}>Preventive</button>
            <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackMaintenanceFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Flag {overview?.summary?.flags_open ?? 0} · open {overview?.summary?.open ?? open} · critical {overview?.summary?.critical ?? 0}</p>
        </PanelCard>
        <PanelCard title="Açık flagler">
          <ul className="space-y-2 text-sm">
            {(overview?.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
            {(overview?.flags || []).slice(0, 10).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackMaintenanceFlag({ id: f.id }).then(() => { ping('Ack'); return refresh() })}>Ack</button>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      <PanelCard title="Yeni ticket">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100 md:col-span-2"
            placeholder="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <select
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100 md:col-span-2"
            placeholder="Varlık (cihaz/kapı)"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
          >
            Aç
          </button>
        </form>
      </PanelCard>

      <PanelCard title={`Kuyruk (${tickets.length})`}>
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium text-slate-100">
                  {t.title}{' '}
                  <span className="text-[10px] uppercase text-slate-500">
                    {t.priority} · {t.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {t.asset || '—'} · {t.venueId || 'genel'}
                </div>
              </div>
              {t.status !== 'done' && (
                <button
                  type="button"
                  onClick={() =>
                    void api.updateTicket(t.id, { status: 'done' })
                      .then(() => refresh())
                      .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                  }
                  className="rounded-md bg-emerald-600/80 px-2 py-1 text-xs text-white"
                >
                  Kapat
                </button>
              )}
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
