import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  type Announcement,
} from '../services/announcements'

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Announcement[]>([])
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')

  async function refresh() {
    try {
      const data = await fetchAnnouncements()
      setRows(data.announcements)
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

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Duyurular</h1>
        <p className="mt-1 text-sm text-slate-400">Holding / marka brifing panosu.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

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
                    {a.audience} · {new Date(a.createdAt).toLocaleString('tr-TR')}
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
