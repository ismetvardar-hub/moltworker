import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/tips'
import { fetchTips, postTip, type TipEntry } from '../services/tips'

export default function TipsPage() {
  const [balance, setBalance] = useState(0)
  const [todayIn, setTodayIn] = useState(0)
  const [todayOut, setTodayOut] = useState(0)
  const [entries, setEntries] = useState<TipEntry[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [amount, setAmount] = useState(50)
  const [kind, setKind] = useState('in')
  const [person, setPerson] = useState('')
  const [note, setNote] = useState('')

  async function refresh() {
    try {
      const data = await fetchTips()
      setBalance(data.balance)
      setTodayIn(data.todayIn)
      setTodayOut(data.todayOut)
      setEntries(data.entries)
      setOverview(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Havuz alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await postTip({
        amount,
        kind,
        person: person.trim() || undefined,
        note: note.trim() || undefined,
      })
      setNote('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Bahşiş Havuzu</h1>
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

      <PanelCard title={overview?.title || 'Tips ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((l: string) => <li key={l}>{l}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runTipsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void api.addTipIn({}).then((r: any) => { ping(`In +${r.entry?.amount ?? 0}`); return refresh() })}>Tip in</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.addTipOut({}).then((r: any) => { ping(`Out −${r.entry?.amount ?? 0}`); return refresh() })}>Tip out</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.tipBalanceSnapshot({}).then((r: any) => { ping(`Snap ${r.snapshot?.id ? 'ok' : '—'}`); return refresh() })}>Balance snap</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackTipsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Flag {(overview?.summary as any)?.flags_open ?? 0}</p>
      </PanelCard>

      <PanelCard title="Hareket">
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400">
            Tutar
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <label className="text-xs text-slate-400">
            Tür
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="in">Giriş</option>
              <option value="out">Dağıtım</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Personel
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Not
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
            >
              Kaydet
            </button>
          </div>
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
              · bakiye {e.balance}
              {e.person ? ` · ${e.person}` : ''} · {e.actor}
              <div className="text-[11px] text-slate-600">
                {new Date(e.at).toLocaleString('tr-TR')}
                {e.note ? ` — ${e.note}` : ''}
              </div>
            </li>
          ))}
          {entries.length === 0 && <li>Henüz hareket yok.</li>}
        </ul>
      </PanelCard>
    </div>
  )
}
