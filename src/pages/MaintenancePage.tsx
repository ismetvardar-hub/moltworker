import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  createTicket,
  fetchMaintenance,
  updateTicket,
  type MaintenanceTicket,
} from '../services/maintenance'

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [open, setOpen] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [asset, setAsset] = useState('')
  const [priority, setPriority] = useState('medium')

  async function refresh() {
    try {
      const data = await fetchMaintenance()
      setTickets(data.tickets)
      setOpen(data.open)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ticketlar alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createTicket({ title: title.trim(), asset, priority })
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Bakım Ticket</h1>
        <p className="mt-1 text-sm text-slate-400">Açık {open} — arıza / bakım kuyruğu.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

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
                    void updateTicket(t.id, { status: 'done' })
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
