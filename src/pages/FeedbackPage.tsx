import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/feedback'
import { createFeedback, fetchFeedback, type Feedback } from '../services/feedback'

export default function FeedbackPage() {
  const [rows, setRows] = useState<Feedback[]>([])
  const [nps, setNps] = useState<number | null>(null)
  const [avg, setAvg] = useState<number | null>(null)
  const [counts, setCounts] = useState({ promoters: 0, passives: 0, detractors: 0 })
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
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
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Geri bildirim alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }

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
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}

      <PanelCard title={overview?.title || 'Feedback ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((l: string) => <li key={l}>{l}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runFeedbackSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.seedNpsFeedback({}).then((r: any) => { ping(`NPS seed ${r.created?.length ?? 0}`); return refresh() })}>NPS seed</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.flagLowScores({}).then((r: any) => { ping(`Low flag ${r.created?.length ?? 0}`); return refresh() })}>Flag lows</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.archiveFeedbackFlags({}).then((r: any) => { ping(`Archive ${r.archived?.length ?? 0}`); return refresh() })}>Archive flags</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackFeedbackFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Flag {(overview?.summary as any)?.flags_open ?? 0}</p>
      </PanelCard>

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
