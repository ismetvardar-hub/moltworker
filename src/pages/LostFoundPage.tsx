import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  createLostFound,
  fetchLostFound,
  updateLostFound,
  type LostFoundItem,
} from '../services/lostfound'

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [stats, setStats] = useState({ stored: 0, returned: 0 })
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState('')
  const [location, setLocation] = useState('')

  async function refresh() {
    try {
      const data = await fetchLostFound()
      setItems(data.items)
      setStats({ stored: data.stored, returned: data.returned })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createLostFound({ item: item.trim(), location: location.trim() })
      setItem('')
      setLocation('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kayıp Eşya</h1>
        <p className="mt-1 text-sm text-slate-400">
          Depoda {stats.stored} · iade {stats.returned}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Yeni kayıt">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100 md:col-span-2"
            placeholder="Eşya"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
          />
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="Bulunduğu yer"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit"
          >
            Kaydet
          </button>
        </form>
      </PanelCard>

      <PanelCard title={`Defter (${items.length})`}>
        <ul className="space-y-2">
          {items.map((x) => (
            <li
              key={x.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium text-slate-100">
                  {x.item} · {x.status}
                </div>
                <div className="text-xs text-slate-500">
                  {x.location || '—'} · {x.venueId} · {x.foundBy}
                </div>
              </div>
              {x.status === 'stored' && (
                <button
                  type="button"
                  onClick={() =>
                    void updateLostFound(x.id, { status: 'returned', claimant: 'Sahibi' })
                      .then(() => refresh())
                      .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                  }
                  className="rounded-md bg-emerald-600/80 px-2 py-1 text-xs text-white"
                >
                  İade et
                </button>
              )}
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
