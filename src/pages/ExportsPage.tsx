import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  downloadExport,
  fetchExportCatalog,
  type ExportCatalogItem,
} from '../services/exports'

export default function ExportsPage() {
  const [catalog, setCatalog] = useState<ExportCatalogItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchExportCatalog()
        setCatalog(data.catalog)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Katalog alınamadı')
      }
    })()
  }, [])

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
