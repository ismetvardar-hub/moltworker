import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackBudgetFlag,
  approveBudgetAdjustment,
  createBudget,
  fetchBudget,
  flagBudgetOverspendLine,
  runBudgetSweep,
  seedForecastBudgetGap,
} from '../services/budget'

export default function BudgetPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({"label":"Kalem","planned":"10000","actual":"0","period":"2026-08"})

  async function refresh() {
    try {
      const data = await fetchBudget()
      setRows(data.lines || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }

  useEffect(() => { void refresh() }, [])

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2600)
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','minutes','score','planned','actual','balance','etaMin','minQty']) {
        if (k in payload) payload[k] = Number(payload[k]) || 0
      }
      await createBudget(payload)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Bütçe</h1>
        <p className="mt-1 text-sm text-slate-400">PLUTUS satırları.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Ops toolbar" subtitle="Wave 165">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runBudgetSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() }).catch((e) => setError(String(e.message || e)))}>Sweep</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackBudgetFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Flag ack</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void flagBudgetOverspendLine({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Overspend line' : r.error || 'Overspend yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Overspend</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void approveBudgetAdjustment({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Adjustment approved' : r.error || 'Approve yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Approve adjustment</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={() => void seedForecastBudgetGap({ label: 'Forecast gap line' }).then(() => { ping('Forecast gap seed'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Seed gap</button>
        </div>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="label" value={String(form.label ?? '')} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="planned" value={String(form.planned ?? '')} onChange={(e) => setForm((f) => ({ ...f, planned: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="actual" value={String(form.actual ?? '')} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="period" value={String(form.period ?? '')} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title || r.guestName || r.code || r.area || r.item || r.label || r.sku || r.ticket || r.name || r.person || r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.service || r.items || r.note || r.channel || r.vendor || r.holder || r.phone || r.role || ''}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
