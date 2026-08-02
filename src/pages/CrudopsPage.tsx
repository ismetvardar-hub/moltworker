import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { fetchCrudopsRegistry } from '../services/crudops'

export default function CrudopsPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [domain, setDomain] = useState('carbonlog')
  async function refresh() {
    try {
      setData(await fetchCrudopsRegistry())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    }
  }
  useEffect(() => { void refresh() }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">CRUD Ops</h1>
        <p className="mt-1 text-sm text-slate-400">İnce domain registry — generic sweep / advance / heal.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title={data.title || 'CRUD Ops'}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(data.summaryLines || []).map((l: string) => <li key={l}>{l}</li>)}
            </ul>
            <p className="mt-2 text-xs text-slate-500">Toplam domain: {data.total ?? 0}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                {(data.sample || []).map((d: any) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <CrudOpsBar domain={domain} onDone={() => void refresh()} />
            </div>
          </PanelCard>
          <PanelCard title="Örnek domainler">
            <ul className="max-h-96 space-y-1 overflow-auto text-sm text-slate-300">
              {(data.sample || []).map((d: any) => (
                <li key={d.name} className="flex justify-between rounded border border-obsidian-700 px-2 py-1">
                  <button type="button" className="text-lykia-300" onClick={() => setDomain(d.name)}>{d.name}</button>
                  <span className="text-xs text-slate-500">{(d.statuses || []).join(' · ')}</span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
