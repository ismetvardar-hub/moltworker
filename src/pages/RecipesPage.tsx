import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { cookRecipe, fetchRecipes, type Recipe } from '../services/recipes'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function refresh() {
    try {
      const data = await fetchRecipes()
      setRecipes(data.recipes)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reçeteler alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCook(id: string) {
    setBusy(id)
    try {
      const result = await cookRecipe(id, 1)
      setMsg(`Pişirildi ×${result.portions} · ${result.movements.length} stok hareketi`)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pişirme başarısız')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Reçeteler</h1>
        <p className="mt-1 text-sm text-slate-400">
          Mutfak kartları — pişirince HEPHAESTUS stok düşer.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {msg && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {msg}
        </p>
      )}

      <PanelCard title={`Kartlar (${recipes.length})`}>
        <ul className="space-y-3">
          {recipes.map((r) => (
            <li key={r.id} className="rounded-lg border border-obsidian-700 px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {r.name} · {r.prepMinutes} dk
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {(r.ingredients || []).map((i) => `${i.name}×${i.qty}`).join(' · ') || 'malzeme yok'}
                  </div>
                  {r.steps?.length > 0 && (
                    <ol className="mt-2 list-decimal pl-4 text-xs text-slate-400">
                      {r.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  )}
                </div>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => void onCook(r.id)}
                  className="rounded-md bg-lykia-500/90 px-2.5 py-1.5 text-xs font-medium text-obsidian-950 hover:bg-lykia-400 disabled:opacity-50"
                >
                  {busy === r.id ? '…' : 'Pişir ×1'}
                </button>
              </div>
            </li>
          ))}
          {recipes.length === 0 && <li className="text-sm text-slate-500">Reçete yok.</li>}
        </ul>
      </PanelCard>
    </div>
  )
}
