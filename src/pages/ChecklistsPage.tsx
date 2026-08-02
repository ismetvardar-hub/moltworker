import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/checklists'
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
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await fetchChecklists()
      setTemplates(data.templates)
      setRuns(data.runs)
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Listeler alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }

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
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={overview?.title || 'Checklist ops'}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{(overview?.summaryLines || []).map((l: string) => (<li key={l}>{l}</li>))}</ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runChecklistsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
            <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.startChecklistOpsRun({}).then((r: any) => { ping(`Start ${r.run?.id || ''}`); return refresh() })}>Start run</button>
            <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.completeChecklistOpsRun({}).then((r: any) => { ping(`Complete ${r.completed?.length ?? 0}`); return refresh() })}>Complete run</button>
            <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.failResetChecklistItem({}).then((r: any) => { ping(`Fail ${r.failed?.[0] || r.reset?.[0] || ''}`); return refresh() })}>Fail/reset</button>
            <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackChecklistsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Flag {overview?.summary?.flags_open ?? 0} · open {overview?.summary?.open_runs ?? overview?.openRuns ?? 0}</p>
        </PanelCard>
        <PanelCard title="Açık flagler">
          <ul className="space-y-2 text-sm">
            {(overview?.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
            {(overview?.flags || []).slice(0, 10).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackChecklistsFlag({ id: f.id }).then(() => { ping('Ack'); return refresh() })}>Ack</button>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

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
