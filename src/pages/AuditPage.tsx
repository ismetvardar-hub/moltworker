import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchAudit, type AuditEntry } from '../services/audit'

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchAudit(120)
        setEntries(data.entries)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Audit yüklenemedi')
      }
    })()
  }, [])

  const filtered = entries.filter((e) => {
    if (!q.trim()) return true
    const hay = `${e.actor} ${e.action} ${e.detail}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Denetim Günlüğü</h1>
        <p className="mt-1 text-sm text-slate-400">Platform audit izi — kim ne yaptı.</p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <input
        className="w-full max-w-md rounded-md border border-obsidian-600 bg-obsidian-950 px-3 py-2 text-sm text-slate-100"
        placeholder="Ara: aktör, aksiyon, detay…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <PanelCard title={`Kayıtlar (${filtered.length})`}>
        <ul className="space-y-2 text-sm">
          {filtered.map((e, i) => (
            <li
              key={e.id || `${e.at}-${i}`}
              className="rounded-lg border border-obsidian-700 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-lykia-300">{e.action}</span>
                <span className="text-slate-300">{e.actor}</span>
              </div>
              <div className="text-slate-400">{e.detail}</div>
              <div className="text-[11px] text-slate-600">
                {e.at ? new Date(e.at).toLocaleString('tr-TR') : '—'}
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="text-slate-500">Kayıt yok.</li>}
        </ul>
      </PanelCard>
    </div>
  )
}
