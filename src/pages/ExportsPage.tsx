import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/exports'
import {
  downloadExport,
  fetchExportCatalog,
  type ExportCatalogItem,
} from '../services/exports'

export default function ExportsPage() {
  const [catalog, setCatalog] = useState<ExportCatalogItem[]>([])
  const [hub, setHub] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await fetchExportCatalog()
      setCatalog(data.catalog || [])
      setHub(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Katalog alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }

  async function onDownload(id: string) {
    setBusy(id)
    try {
      await downloadExport(id)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İndirme başarısız')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Dışa Aktarım</h1>
        <p className="mt-1 text-sm text-slate-400">
          Operasyon veri setlerini CSV olarak indir — rapor ve muhasebe köprüsü.
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

      {hub && (
        <PanelCard title={hub.title || 'Export ops'}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(hub.summaryLines || []).map((l: string) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runExportsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
            <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.runExportsSnapshot({}).then((r: any) => { ping(`Snapshot ${r.snapshot?.id ? 'ok' : '—'}`); return refresh() })}>Snapshot</button>
            <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.exportAllCatalog({ sample: true }).then((r: any) => { ping(`Runs +${r.runs?.length ?? 0}`); return refresh() })}>Export all</button>
            <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.clearExportsRuns({}).then((r: any) => { ping(`Cleared ${r.cleared ?? 0}`); return refresh() })}>Clear runs</button>
            <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackExportsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Flag {hub.summary?.flags_open ?? 0} · katalog {hub.summary?.catalog_size ?? catalog.length} · run {hub.summary?.runs ?? 0}
          </p>
        </PanelCard>
      )}

      <PanelCard title={`Katalog (${catalog.length})`}>
        <ul className="grid gap-2 md:grid-cols-2">
          {catalog.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-obsidian-700 px-3 py-3"
            >
              <div>
                <div className="text-sm font-medium text-slate-100">{c.label}</div>
                <div className="text-[11px] text-slate-500">{c.columns.join(' · ')}</div>
              </div>
              <button
                type="button"
                disabled={busy === c.id}
                onClick={() => void onDownload(c.id)}
                className="shrink-0 rounded-md bg-lykia-500/90 px-2.5 py-1.5 text-xs font-medium text-obsidian-950 hover:bg-lykia-400 disabled:opacity-50"
              >
                {busy === c.id ? '…' : 'CSV'}
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
