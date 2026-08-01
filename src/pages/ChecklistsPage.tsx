import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  fetchChecklists,
  startChecklist,
  toggleCheck,
  type ChecklistRun,
  type ChecklistTemplate,
} from '../services/checklists'

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [runs, setRuns] = useState<ChecklistRun[]>([])
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await fetchChecklists()
      setTemplates(data.templates)
      setRuns(data.runs)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Listeler alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kontrol Listeleri</h1>
        <p className="mt-1 text-sm text-slate-400">Açılış / kapanış prosedürleri.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Şablonlar">
        <ul className="space-y-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium text-slate-100">
                  {t.name} · {t.kind}
                </div>
                <div className="text-xs text-slate-500">
                  {t.venueId} · {t.items.length} madde
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  void startChecklist(t.id)
                    .then(() => refresh())
                    .catch((e) => setError(e instanceof Error ? e.message : 'Başlatılamadı'))
                }
                className="rounded-md bg-lykia-500/90 px-2.5 py-1.5 text-xs font-medium text-obsidian-950"
              >
                Başlat
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>

      <PanelCard title={`Aktif / geçmiş (${runs.length})`}>
        <ul className="space-y-4">
          {runs.map((r) => (
            <li key={r.id} className="rounded-lg border border-obsidian-700 px-3 py-3">
              <div className="mb-2 text-sm font-medium text-slate-100">
                {r.name} · {r.status}
              </div>
              <ul className="space-y-1">
                {r.checks.map((c) => (
                  <li key={c.id}>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={c.done}
                        onChange={() =>
                          void toggleCheck(r.id, c.id, !c.done)
                            .then(() => refresh())
                            .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                        }
                      />
                      <span className={c.done ? 'line-through text-slate-500' : ''}>{c.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {runs.length === 0 && <li className="text-sm text-slate-500">Henüz çalıştırma yok.</li>}
        </ul>
      </PanelCard>
    </div>
  )
}
