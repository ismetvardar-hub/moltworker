import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchConsents, recordConsent, type Consent } from '../services/consent'

export default function ConsentPage() {
  const [rows, setRows] = useState<Consent[]>([])
  const [purposes, setPurposes] = useState<string[]>([])
  const [stats, setStats] = useState({ granted: 0, denied: 0 })
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [purpose, setPurpose] = useState('marketing')
  const [granted, setGranted] = useState(true)

  async function refresh() {
    try {
      const data = await fetchConsents()
      setRows(data.consents)
      setPurposes(data.purposes)
      setStats({ granted: data.granted, denied: data.denied })
      if (data.purposes[0] && !data.purposes.includes(purpose)) setPurpose(data.purposes[0])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onay günlüğü alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await recordConsent({ subject: subject.trim(), purpose, granted })
      setSubject('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">KVKK Onay Günlüğü</h1>
        <p className="mt-1 text-sm text-slate-400">
          VALKYRIE — onay {stats.granted} · ret {stats.denied}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Yeni kayıt">
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400 md:col-span-2">
            Kişi
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Amaç
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Karar
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={granted ? 'yes' : 'no'}
              onChange={(e) => setGranted(e.target.value === 'yes')}
            >
              <option value="yes">Onay</option>
              <option value="no">Ret</option>
            </select>
          </label>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Kaydet
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard title={`Günlük (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((c) => (
            <li key={c.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={c.granted ? 'text-emerald-300' : 'text-rose-300'}>
                  {c.granted ? 'ONAY' : 'RET'}
                </span>
                <span className="font-medium text-slate-200">{c.subject}</span>
                <span className="text-[10px] uppercase text-slate-500">{c.purpose}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                {c.channel} · {c.version} · {new Date(c.at).toLocaleString('tr-TR')}
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
