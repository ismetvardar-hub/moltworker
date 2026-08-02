import { useEffect, useMemo, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { fetchCrudopsRegistry } from '../services/crudops'

type CrudDomain = {
  name: string
  statuses?: string[]
}

export default function CrudopsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [domain, setDomain] = useState('carbonlog')
  const [filter, setFilter] = useState('')
  async function refresh() {
    try {
      setData(await fetchCrudopsRegistry())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    }
  }
  useEffect(() => { void refresh() }, [])

  const domains = useMemo<CrudDomain[]>(() => {
    const raw = Array.isArray(data?.domains) && data.domains.length
      ? data.domains
      : (Array.isArray(data?.sample) ? data.sample : [])
    return raw
      .filter((d: any) => d?.name)
      .map((d: any) => ({ name: String(d.name), statuses: Array.isArray(d.statuses) ? d.statuses : [] }))
  }, [data])

  useEffect(() => {
    if (domains.length && !domains.some((d) => d.name === domain)) {
      setDomain(domains[0].name)
    }
  }, [domains, domain])

  const filteredDomains = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return domains
    return domains.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      (d.statuses || []).some((s) => s.toLowerCase().includes(q)),
    )
  }, [domains, filter])

  const selectDomains = filteredDomains.some((d) => d.name === domain)
    ? filteredDomains
    : [{ name: domain, statuses: [] }, ...filteredDomains]

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">CRUD Ops</h1>
        <p className="mt-1 text-sm text-slate-400">
          İnce domain registry — kalan ince domainler bilinçli olarak generic CRUD ops kullanır.
        </p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title={data.title || 'CRUD Ops'}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(data.summaryLines || []).map((l: string) => <li key={l}>{l}</li>)}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Toplam domain: {data.total ?? domains.length} · filtrelenen: {filteredDomains.length}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Domain ara
                </span>
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="carbonlog, fxrates, handbook..."
                  className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                />
              </label>
              <select
                className="w-full rounded-xl border border-obsidian-600 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                {selectDomains.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <CrudOpsBar domain={domain} onDone={() => void refresh()} />
            </div>
          </PanelCard>
          <PanelCard title="Registry domainleri" subtitle="Tam liste arama ile daraltılır">
            <div className="mb-3 rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Seçili domain</p>
              <p className="mt-1 font-mono text-sm text-lykia-300">{domain}</p>
            </div>
            <ul className="max-h-96 space-y-1 overflow-auto text-sm text-slate-300">
              {filteredDomains.map((d) => (
                <li key={d.name} className="flex justify-between gap-3 rounded border border-obsidian-700 px-2 py-1">
                  <button type="button" className="truncate text-left text-lykia-300" onClick={() => setDomain(d.name)}>{d.name}</button>
                  <span className="shrink-0 text-xs text-slate-500">{(d.statuses || []).join(' · ')}</span>
                </li>
              ))}
              {filteredDomains.length === 0 && (
                <li className="rounded border border-obsidian-700 px-2 py-3 text-slate-500">
                  Filtreyle eşleşen domain yok.
                </li>
              )}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
