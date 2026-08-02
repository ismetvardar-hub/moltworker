import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackAnnouncementsFlag,
  archiveStaleAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  publishHighPriorityAnnouncements,
  runAnnouncementsSweep,
  seedEndingSoonAnnouncement,
  type Announcement,
} from '../services/announcements'

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Announcement[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')

  async function refresh() {
    try {
      const data = await fetchAnnouncements()
      setRows(data.announcements)
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duyurular alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim(), priority })
      setTitle('')
      setBody('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yayın başarısız')
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteAnnouncement(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme başarısız')
    }
  }

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Duyurular</h1>
        <p className="mt-1 text-sm text-slate-400">
          Holding / marka brifing panosu · published {overview?.published ?? 0}
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

      <PanelCard title={overview?.title || 'Duyuru ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runAnnouncementsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void publishHighPriorityAnnouncements({}).then((r: any) => { ping(`Published ${r.published?.length ?? 0}`); return refresh() })}>Publish high</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void archiveStaleAnnouncements({}).then((r: any) => { ping(`Archived ${r.archived?.length ?? 0}`); return refresh() })}>Archive stale</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void seedEndingSoonAnnouncement({}).then((r: any) => { ping(`Ending soon ${r.seeded?.length ?? 0}`); return refresh() })}>Seed ending soon</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackAnnouncementsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · high unpublished {overview?.unpublishedHighPriority ?? 0} · ending soon {overview?.endingSoon ?? 0}
        </p>
      </PanelCard>

      <PanelCard title="Yeni duyuru">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
          <input
            className="w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="Metin"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Yayınla
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard title={`Akış (${rows.length})`}>
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="rounded-lg border border-obsidian-700 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {a.title}{' '}
                    <span className="text-[10px] uppercase text-slate-500">{a.priority}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{a.body}</p>
                  <div className="mt-1 text-[11px] text-slate-600">
                    {a.audience} · {a.status} · {new Date(a.createdAt).toLocaleString('tr-TR')}
                    {a.endAt ? ` · biter ${new Date(a.endAt).toLocaleDateString('tr-TR')}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onDelete(a.id)}
                  className="text-xs text-slate-500 hover:text-rose-300"
                >
                  sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
