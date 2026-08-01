import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchEnergy, logEnergy, type EnergyReading, type Meter } from '../services/energy'

export default function EnergyPage() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [readings, setReadings] = useState<EnergyReading[]>([])
  const [meterId, setMeterId] = useState('')
  const [value, setValue] = useState(100)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await fetchEnergy()
      setMeters(data.meters)
      setReadings(data.readings)
      if (!meterId && data.meters[0]) setMeterId(data.meters[0].id)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enerji verisi alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onLog(e: FormEvent) {
    e.preventDefault()
    try {
      await logEnergy({ meterId, value })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Enerji</h1>
        <p className="mt-1 text-sm text-slate-400">Sayaç okumaları — elektrik / su / gaz.</p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Okuma gir">
        <form onSubmit={(e) => void onLog(e)} className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={meterId}
            onChange={(e) => setMeterId(e.target.value)}
          >
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
          >
            Kaydet
          </button>
        </form>
      </PanelCard>
      <PanelCard title="Son okumalar">
        <ul className="space-y-2 text-sm text-slate-400">
          {readings.map((r) => (
            <li key={r.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
              <span className="text-lykia-300">
                {r.value} {r.unit}
              </span>{' '}
              · {r.meterName} · {r.actor}
              <div className="text-[11px] text-slate-600">
                {new Date(r.at).toLocaleString('tr-TR')}
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
