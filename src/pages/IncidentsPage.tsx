import { FormEvent, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import PanelCard from '../components/PanelCard'
import {
  ackIncident,
  createIncident,
  fetchIncidents,
  type Incident,
} from '../services/incidents'

const SEV: Record<string, string> = {
  critical: 'bg-rose-500/20 text-rose-200',
  error: 'bg-orange-500/20 text-orange-200',
  warning: 'bg-amber-500/20 text-amber-200',
  info: 'bg-sky-500/20 text-sky-200',
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [open, setOpen] = useState(0)
  const [critical, setCritical] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [severity, setSeverity] = useState('warning')
  const [showClosed, setShowClosed] = useState(false)

  async function refresh() {
    try {
      const data = await fetchIncidents()
      setIncidents(data.incidents)
      setOpen(data.open)
      setCritical(data.critical)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Olaylar yüklenemedi')
    }
  }

  useEffect(() => {
    void refresh()
    const t = window.setInterval(() => void refresh(), 15000)
    return () => window.clearInterval(t)
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createIncident({ title: title.trim(), detail, severity })
      setTitle('')
      setDetail('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  async function onAck(id: string, status: 'acked' | 'resolved') {
    try {
      await ackIncident(id, status)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onay başarısız')
    }
  }

  const visible = incidents.filter((i) => showClosed || i.status === 'open')

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Olay Panosu</h1>
        <p className="mt-1 text-sm text-slate-400">
          Açık {open} · kritik {critical} — stok, görev ve geçiş sinyalleri birleşik.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Manuel olay">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400 md:col-span-2">
            Başlık
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Şiddet
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="error">error</option>
              <option value="critical">critical</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Ekle
            </button>
          </div>
          <label className="text-xs text-slate-400 md:col-span-4">
            Detay
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </label>
        </form>
      </PanelCard>

      <PanelCard title={`Olaylar (${visible.length})`}>
        <label className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
          />
          Kapanmışları da göster
        </label>
        <ul className="space-y-2">
          {visible.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-obsidian-700 bg-obsidian-950/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${SEV[i.severity] || SEV.info}`}>
                    {i.severity}
                  </span>
                  <span className="text-[10px] uppercase text-slate-500">{i.source}</span>
                  <span className="text-[10px] text-slate-600">{i.status}</span>
                </div>
                <div className="mt-1 font-medium text-slate-100">{i.title}</div>
                <div className="text-xs text-slate-500">{i.detail}</div>
                <div className="mt-1 text-[11px] text-slate-600">
                  {new Date(i.at).toLocaleString('tr-TR')}
                </div>
              </div>
              {i.status === 'open' && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void onAck(i.id, 'acked')}
                    className="inline-flex items-center gap-1 rounded-md border border-obsidian-600 px-2 py-1 text-xs text-slate-300 hover:bg-obsidian-800"
                  >
                    <Check className="h-3 w-3" />
                    ack
                  </button>
                  <button
                    type="button"
                    onClick={() => void onAck(i.id, 'resolved')}
                    className="rounded-md bg-emerald-600/80 px-2 py-1 text-xs text-white"
                  >
                    çöz
                  </button>
                </div>
              )}
            </li>
          ))}
          {visible.length === 0 && <li className="text-sm text-slate-500">Açık olay yok — ETHOS tebessüm eder.</li>}
        </ul>
      </PanelCard>
    </div>
  )
}
