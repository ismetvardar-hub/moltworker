import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { createFeedback, fetchFeedback, type Feedback } from '../services/feedback'

export default function FeedbackPage() {
  const [rows, setRows] = useState<Feedback[]>([])
  const [nps, setNps] = useState<number | null>(null)
  const [avg, setAvg] = useState<number | null>(null)
  const [counts, setCounts] = useState({ promoters: 0, passives: 0, detractors: 0 })
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState(9)
  const [guestName, setGuestName] = useState('')
  const [comment, setComment] = useState('')

  async function refresh() {
    try {
      const data = await fetchFeedback()
      setRows(data.feedback)
      setNps(data.nps)
      setAvg(data.avg)
      setCounts({
        promoters: data.promoters,
        passives: data.passives,
        detractors: data.detractors,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Geri bildirim alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createFeedback({
        score,
        guestName: guestName.trim() || 'Anonim',
        comment,
        channel: 'manual',
      })
      setGuestName('')
      setComment('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Geri Bildirim / NPS</h1>
        <p className="mt-1 text-sm text-slate-400">
          NPS {nps ?? '—'} · ort. {avg ?? '—'} · P {counts.promoters} / N {counts.passives} / D{' '}
          {counts.detractors}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Yeni skor">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400">
            Skor (0–10)
            <input
              type="number"
              min={0}
              max={10}
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-slate-400">
            Misafir
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Yorum
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Kaydet
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard title={`Yanıtlar (${rows.length})`}>
        <ul className="space-y-2">
          {rows.map((f) => (
            <li key={f.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lykia-300">{f.score}</span>
                <span className="font-medium text-slate-200">{f.guestName}</span>
                <span className="text-[10px] uppercase text-slate-500">{f.channel}</span>
              </div>
              {f.comment && <p className="mt-1 text-slate-400">{f.comment}</p>}
              <div className="mt-1 text-[11px] text-slate-600">
                {new Date(f.at).toLocaleString('tr-TR')}
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
