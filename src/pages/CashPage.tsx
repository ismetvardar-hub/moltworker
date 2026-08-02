import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackCashFlag,
  fetchCash,
  flagCashImbalance,
  postCash,
  postCashEntry,
  runCashSweep,
  seedCashDailyClose,
  type CashEntry,
} from '../services/cash'

export default function CashPage() {
  const [balance, setBalance] = useState(0)
  const [todayIn, setTodayIn] = useState(0)
  const [todayOut, setTodayOut] = useState(0)
  const [entries, setEntries] = useState<CashEntry[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [amount, setAmount] = useState(100)
  const [kind, setKind] = useState('in')
  const [note, setNote] = useState('')

  async function refresh() {
    try {
      const data = await fetchCash()
      setBalance(data.drawer.balance)
      setTodayIn(data.todayIn)
      setTodayOut(data.todayOut)
      setEntries(data.entries)
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kasa alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await postCash({ amount, kind, note })
      setNote('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    }
  }

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kasa</h1>
        <p className="mt-1 text-sm text-slate-400">
          Bakiye {balance.toLocaleString('tr-TR')} TRY · bugün +{todayIn} / −{todayOut}
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
      <PanelCard title={overview?.title || 'Kasa ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runCashSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void postCashEntry({ amount: 250, kind: 'in', note: 'ops toolbar' }).then((r: any) => { ping(r.ok ? 'Entry posted' : r.error || 'Entry yok'); return refresh() })}>Post entry</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void flagCashImbalance({ varianceTry: 125 }).then((r: any) => { ping(r.flag ? 'Imbalance flagged' : 'Flag mevcut'); return refresh() })}>Flag imbalance</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void seedCashDailyClose({ varianceTry: 125 }).then((r: any) => { ping(r.close ? 'Daily close seed' : 'Seed yok'); return refresh() })}>Seed daily close</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackCashFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · imbalance {overview?.imbalances ?? 0} · daily close eksik {overview?.missingDailyClose ?? 0}
        </p>
      </PanelCard>
      <PanelCard title="Hareket">
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3 md:grid-cols-4">
          <input
            type="number"
            min={1}
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <select
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="in">Giriş</option>
            <option value="out">Çıkış / drop</option>
          </select>
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100 md:col-span-2"
            placeholder="Not"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-4 md:w-fit"
          >
            Kaydet
          </button>
        </form>
      </PanelCard>
      <PanelCard title="Defter">
        <ul className="space-y-2 text-sm text-slate-400">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
              <span className={e.kind === 'in' ? 'text-emerald-300' : 'text-rose-300'}>
                {e.kind === 'in' ? '+' : '−'}
                {e.amount}
              </span>{' '}
              · bakiye {e.balance} · {e.actor}
              <div className="text-[11px] text-slate-600">
                {new Date(e.at).toLocaleString('tr-TR')}
                {e.note ? ` — ${e.note}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
