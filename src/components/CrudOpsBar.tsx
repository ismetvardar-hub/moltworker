import { useState } from 'react'
import * as api from '../services/crudops'

type Props = {
  domain: string
  onDone?: () => void
}

/** Shared ops bar for thin CRUD domain pages (sweep / advance / heal / seed / ack). */
export default function CrudOpsBar({ domain, onDone }: Props) {
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }

  async function run(label: string, fn: () => Promise<any>) {
    if (busy) return
    setBusy(true)
    try {
      const r = await fn()
      ping(r?.ok === false ? (r.error || `${label} başarısız`) : `${label} OK`)
      onDone?.()
    } catch (e) {
      ping(e instanceof Error ? e.message : `${label} hata`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950 disabled:opacity-50" onClick={() => void run('Sweep', () => api.runCrudDomainSweep(domain, { force: true }))}>Sweep</button>
        <button type="button" disabled={busy} className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100 disabled:opacity-50" onClick={() => void run('Advance', () => api.advanceCrudDomain(domain, {}))}>Advance</button>
        <button type="button" disabled={busy} className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100 disabled:opacity-50" onClick={() => void run('Heal', () => api.healCrudDomain(domain, {}))}>Heal</button>
        <button type="button" disabled={busy} className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100 disabled:opacity-50" onClick={() => void run('Seed', () => api.seedCrudDomain(domain, {}))}>Seed</button>
        <button type="button" disabled={busy} className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm disabled:opacity-50" onClick={() => void run('Flag ack', () => api.ackCrudDomainFlag(domain, {}))}>Flag ack</button>
      </div>
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>
      )}
    </div>
  )
}
