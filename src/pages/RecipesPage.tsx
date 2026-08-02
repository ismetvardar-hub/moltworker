import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackRecipesFlag,
  cookRecipe,
  cookRecipeOps,
  fetchRecipes,
  flagMissingRecipeStock,
  refreshRecipeCosts,
  runRecipesSweep,
  type Recipe,
} from '../services/recipes'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function refresh() {
    try {
      const data = await fetchRecipes()
      setRecipes(data.recipes)
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reçeteler alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
  }

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
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}

      <PanelCard title={overview?.title || 'Reçete ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runRecipesSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void cookRecipeOps({ portions: 1 }).then((r: any) => { ping(`Cook ops ${r.movements?.length ?? 0}`); return refresh() })}>Cook ops</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void flagMissingRecipeStock({}).then((r: any) => { ping(`Missing flag ${r.created?.length ?? 0}`); return refresh() })}>Flag missing stock</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void refreshRecipeCosts({}).then((r: any) => { ping(`Cost ${r.refreshed?.length ?? 0}`); return refresh() })}>Refresh cost</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackRecipesFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Flag {(overview?.summary as any)?.flags_open ?? 0} · eksik {overview?.missingIngredients ?? 0}</p>
      </PanelCard>

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
