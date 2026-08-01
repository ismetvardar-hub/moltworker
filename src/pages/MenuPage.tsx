import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { createMenuItem, fetchMenu, updateMenuItem, type MenuItem } from '../services/menu'

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [avgPrice, setAvgPrice] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(100)
  const [category, setCategory] = useState('ana')

  async function refresh() {
    try {
      const data = await fetchMenu()
      setItems(data.items)
      setAvgPrice(data.avgPrice)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Menü alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createMenuItem({ name: name.trim(), price, category })
      setName('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eklenemedi')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Menü</h1>
        <p className="mt-1 text-sm text-slate-400">
          Katalog · ort. {avgPrice.toLocaleString('tr-TR')} TRY
        </p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Yeni kalem">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100 md:col-span-2"
            placeholder="Ad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="number"
            min={0}
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-4 md:w-fit"
          >
            Ekle
          </button>
        </form>
      </PanelCard>
      <PanelCard title={`Kalemler (${items.length})`}>
        <ul className="space-y-2">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium text-slate-100">
                  {m.name} · {m.price} {m.currency}
                </div>
                <div className="text-xs text-slate-500">
                  {m.category}
                  {m.recipeId ? ` · reçete ${m.recipeId}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  void updateMenuItem(m.id, { available: !m.available })
                    .then(() => refresh())
                    .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                }
                className={`rounded-md px-2 py-1 text-xs ${
                  m.available ? 'bg-emerald-500/20 text-emerald-200' : 'bg-obsidian-800 text-slate-400'
                }`}
              >
                {m.available ? 'açık' : 'kapalı'}
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
