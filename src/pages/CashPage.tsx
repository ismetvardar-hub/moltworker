import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchCash, postCash, type CashEntry } from '../services/cash'

export default function CashPage() {
  const [balance, setBalance] = useState(0)
  const [todayIn, setTodayIn] = useState(0)
  const [todayOut, setTodayOut] = useState(0)
  const [entries, setEntries] = useState<CashEntry[]>([])
  const [error, setError] = useState<string | null>(null)
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
