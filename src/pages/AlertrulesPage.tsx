import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/alertrules'

export default function AlertrulesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({ name: 'Low stock', channel: 'push' })

  async function refresh() {
    try {
      const data = await api.fetchAlertrules()
      setRows(data.alertrules || [])
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty', 'value', 'score', 'minutes', 'balance', 'amount', 'pax', 'seats', 'discount', 'hours', 'hitRate']) {
        if (k in payload) payload[k] = Number(payload[k]) || 0
      }
      await api.createAlertrules(payload)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Alert Kuralları</h1>
        <p className="mt-1 text-sm text-slate-400">Bildirim kural tanımı · enable · fire.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={overview?.title || 'Alertrules ops'}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{(overview?.summaryLines || []).map((l: string) => (<li key={l}>{l}</li>))}</ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runAlertrulesSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
            <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.enableAlertrules({}).then((r: any) => { ping(`Enable ${r.enabled?.length ?? 0}`); return refresh() })}>Enable</button>
            <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.disableAlertrules({}).then((r: any) => { ping(`Disable ${r.disabled?.length ?? 0}`); return refresh() })}>Disable</button>
            <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.fireAlertrules({}).then((r: any) => { ping(`Fire ${r.fired?.length ?? 0}`); return refresh() })}>Fire</button>
            <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackAlertrulesFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Flag {overview?.summary?.flags_open ?? 0} · enabled {overview?.summary?.enabled ?? 0} · disabled {overview?.summary?.disabled ?? 0}</p>
        </PanelCard>
        <PanelCard title="Açık flagler">
          <ul className="space-y-2 text-sm">
            {(overview?.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
            {(overview?.flags || []).slice(0, 10).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackAlertrulesFlag({ id: f.id }).then(() => { ping('Ack'); return refresh() })}>Ack</button>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      <PanelCard title="Yeni">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="name" value={String(form.name ?? '')} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="channel" value={String(form.channel ?? '')} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title || r.name || r.system || r.service || r.target || r.source || r.version || r.gate || r.secret || r.domain || r.to || r.zone || r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.message || r.summary || r.endpoint || r.subject || r.body || r.channel || r.owner || r.label || ''}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={() => void api.patchAlertrules(r.id, { status: 'enabled' }).then(() => refresh()).catch((e) => setError(String(e.message || e)))}>enabled</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={() => void api.patchAlertrules(r.id, { status: 'disabled' }).then(() => refresh()).catch((e) => setError(String(e.message || e)))}>disabled</button>
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
