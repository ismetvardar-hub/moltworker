import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import CrudOpsBar from '../components/CrudOpsBar'
import { createPassstock, fetchPassstock } from '../services/passstock'

export default function PassstockPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({"sku":"CARD-PVC","qty":"50","minQty":"10"})

  async function refresh() {
    try {
      const data = await fetchPassstock()
      setRows(data.items || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }

  useEffect(() => { void refresh() }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','minutes','score','planned','actual','balance','etaMin','minQty']) {
        if (k in payload) payload[k] = Number(payload[k]) || 0
      }
      await createPassstock(payload)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Pass Stok</h1>
        <p className="mt-1 text-sm text-slate-400">Kart/bileklik envanteri.</p>
      </header>
      <CrudOpsBar domain="passstock" onDone={() => void refresh()} />

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="sku" value={String(form.sku ?? '')} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="qty" value={String(form.qty ?? '')} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="minQty" value={String(form.minQty ?? '')} onChange={(e) => setForm((f) => ({ ...f, minQty: e.target.value }))} />
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
