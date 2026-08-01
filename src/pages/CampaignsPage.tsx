import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  createCampaign,
  fetchCampaigns,
  updateCampaign,
  type Campaign,
} from '../services/campaigns'

export default function CampaignsPage() {
  const [rows, setRows] = useState<Campaign[]>([])
  const [active, setActive] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [discountPct, setDiscountPct] = useState(10)

  async function refresh() {
    try {
      const data = await fetchCampaigns()
      setRows(data.campaigns)
      setActive(data.active)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kampanyalar alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createCampaign({ name: name.trim(), code: code.trim(), discountPct })
      setName('')
      setCode('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kampanyalar</h1>
        <p className="mt-1 text-sm text-slate-400">Aktif {active} promo.</p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Yeni kampanya">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100 md:col-span-2"
            placeholder="Ad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="Kod"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            type="number"
            min={0}
            max={90}
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={discountPct}
            onChange={(e) => setDiscountPct(Number(e.target.value))}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-4 md:w-fit"
          >
            Yayınla
          </button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium text-slate-100">
                  {c.name} · {c.code} · %{c.discountPct}
                </div>
                <div className="text-xs text-slate-500">
                  {c.startDate} → {c.endDate} · {c.status}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  void updateCampaign(c.id, {
                    status: c.status === 'active' ? 'paused' : 'active',
                  })
                    .then(() => refresh())
                    .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                }
                className="rounded-md bg-obsidian-800 px-2 py-1 text-xs text-slate-300"
              >
                {c.status === 'active' ? 'duraklat' : 'aktifleştir'}
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
