import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackEnergyFlag,
  fetchEnergy,
  flagEnergySpike,
  logEnergy,
  recordEnergyReading,
  runEnergySweep,
  seedEnergyMeter,
  type EnergyReading,
  type Meter,
} from '../services/energy'

export default function EnergyPage() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [readings, setReadings] = useState<EnergyReading[]>([])
  const [meterId, setMeterId] = useState('')
  const [value, setValue] = useState(100)
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function refresh() {
    try {
      const data = await fetchEnergy()
      setMeters(data.meters)
      setReadings(data.readings)
      setOverview(data)
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

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
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
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      <PanelCard title={overview?.title || 'Enerji ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runEnergySweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void recordEnergyReading({ meterId, value }).then((r: any) => { ping(r.reading ? 'Reading logged' : 'Reading yok'); return refresh() })}>Log reading</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void flagEnergySpike({ meterId }).then((r: any) => { ping(r.flag ? 'Spike flagged' : 'Spike logged'); return refresh() })}>Flag spike</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void seedEnergyMeter({}).then((r: any) => { ping(r.meter ? 'Meter seed' : 'Seed yok'); return refresh() })}>Seed meter</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackEnergyFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · spike {overview?.spikes ?? 0} · okumasız {overview?.missingReadings ?? 0}
        </p>
      </PanelCard>
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
