import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { createHandover, fetchHandover, type HandoverNote } from '../services/handover'

export default function HandoverPage() {
  const [notes, setNotes] = useState<HandoverNote[]>([])
  const [stats, setStats] = useState({ today: 0, high: 0 })
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [fromShift, setFromShift] = useState('08:00–16:00')
  const [toShift, setToShift] = useState('16:00–00:00')
  const [priority, setPriority] = useState('normal')

  async function refresh() {
    try {
      const data = await fetchHandover()
      setNotes(data.notes)
      setStats({ today: data.today, high: data.high })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Notlar alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createHandover({ body: body.trim(), fromShift, toShift, priority })
      setBody('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Vardiya Teslim</h1>
        <p className="mt-1 text-sm text-slate-400">
          Bugün {stats.today} · yüksek öncelik {stats.high}
        </p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Yeni teslim notu">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
          <textarea
            className="w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={fromShift}
              onChange={(e) => setFromShift(e.target.value)}
              placeholder="Kimden"
            />
            <input
              className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={toShift}
              onChange={(e) => setToShift(e.target.value)}
              placeholder="Kime"
            />
            <select
              className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
          >
            Kaydet
          </button>
        </form>
      </PanelCard>
      <PanelCard title={`Notlar (${notes.length})`}>
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-sm">
              <div className="font-medium text-slate-100">
                {n.author} · {n.priority}
              </div>
              <p className="mt-1 text-slate-400">{n.body}</p>
              <div className="mt-1 text-[11px] text-slate-600">
                {n.fromShift} → {n.toShift} · {new Date(n.at).toLocaleString('tr-TR')}
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
