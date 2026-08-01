import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  adjustLoyalty,
  fetchLoyalty,
  type LedgerEntry,
  type LoyaltyAccount,
} from '../services/loyalty'

export default function LoyaltyPage() {
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState('')
  const [delta, setDelta] = useState(10)
  const [reason, setReason] = useState('earn')
  const [note, setNote] = useState('')

  async function refresh() {
    try {
      const data = await fetchLoyalty()
      setAccounts(data.accounts)
      setLedger(data.ledger)
      setTotalPoints(data.totalPoints)
      if (!selected && data.accounts[0]) setSelected(data.accounts[0].id)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sadakat verisi alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onAdjust(e: FormEvent) {
    e.preventDefault()
    try {
      await adjustLoyalty({
        accountId: selected,
        delta,
        reason,
        note,
      })
      setNote('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Puan hareketi başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Sadakat / Daze-Gift</h1>
        <p className="mt-1 text-sm text-slate-400">
          AURA puan defteri — toplam {totalPoints.toLocaleString('tr-TR')} puan · {accounts.length}{' '}
          hesap
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Puan hareketi">
        <form onSubmit={(e) => void onAdjust(e)} className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400 md:col-span-2">
            Hesap
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.guestName} ({a.points} · {a.tier})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Delta
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-slate-400">
            Neden
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="earn">earn</option>
              <option value="redeem">redeem</option>
              <option value="gift">gift</option>
              <option value="adjust">adjust</option>
            </select>
          </label>
          <label className="text-xs text-slate-400 md:col-span-3">
            Not
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Uygula
            </button>
          </div>
        </form>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Hesaplar">
          <ul className="space-y-2">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-200">{a.guestName}</div>
                  <div className="text-xs text-slate-500">{a.tier}</div>
                </div>
                <div className="font-mono text-lykia-300">{a.points}</div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Defter">
          <ul className="space-y-2 text-sm text-slate-400">
            {ledger.map((e) => (
              <li key={e.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
                <span className={e.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {e.delta >= 0 ? '+' : ''}
                  {e.delta}
                </span>{' '}
                · {e.guestName} · {e.reason} · {e.actor}
                <div className="text-xs text-slate-600">
                  {new Date(e.at).toLocaleString('tr-TR')} → {e.points}
                </div>
              </li>
            ))}
            {ledger.length === 0 && <li>Henüz hareket yok.</li>}
          </ul>
        </PanelCard>
      </div>
    </div>
  )
}
