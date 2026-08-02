import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackColdchainFlag,
  fetchColdchain,
  flagColdchainBreach,
  logCold,
  recordColdchainReading,
  runColdchainSweep,
  seedColdchainProbe,
  type ColdAsset,
  type ColdReading,
} from '../services/coldchain'

export default function ColdchainPage() {
  const [assets, setAssets] = useState<ColdAsset[]>([])
  const [readings, setReadings] = useState<ColdReading[]>([])
  const [alerts, setAlerts] = useState(0)
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [assetId, setAssetId] = useState('')
  const [tempC, setTempC] = useState(3)

  async function refresh() {
    try {
      const data = await fetchColdchain()
      setAssets(data.assets)
      setReadings(data.readings)
      setAlerts(data.recentAlerts)
      setOverview(data)
      if (!assetId && data.assets[0]) setAssetId(data.assets[0].id)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Soğuk zincir alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onLog(e: FormEvent) {
    e.preventDefault()
    try {
      await logCold({ assetId, tempC })
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Soğuk Zincir</h1>
        <p className="mt-1 text-sm text-slate-400">LOGOS — son alarmlar: {alerts}</p>
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
      <PanelCard title={overview?.title || 'Soğuk zincir ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runColdchainSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void recordColdchainReading({ assetId, tempC }).then((r: any) => { ping(r.reading ? 'Reading logged' : 'Reading yok'); return refresh() })}>Log reading</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void flagColdchainBreach({ assetId }).then((r: any) => { ping(r.flag ? 'Breach flagged' : 'Breach logged'); return refresh() })}>Flag breach</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void seedColdchainProbe({}).then((r: any) => { ping(r.probe ? 'Probe seed' : 'Seed yok'); return refresh() })}>Seed probe</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackColdchainFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · alarm {overview?.recentAlerts ?? 0} · okumasız {overview?.missingReadings ?? 0}
        </p>
      </PanelCard>
      <PanelCard title="Sıcaklık kaydı">
        <form onSubmit={(e) => void onLog(e)} className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.minC}…{a.maxC}°C)
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={tempC}
            onChange={(e) => setTempC(Number(e.target.value))}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
          >
            Kaydet
          </button>
        </form>
      </PanelCard>
      <PanelCard title="Okumalar">
        <ul className="space-y-2 text-sm">
          {readings.map((r) => (
            <li
              key={r.id}
              className={`rounded-lg border px-3 py-2 ${
                r.ok ? 'border-obsidian-700' : 'border-rose-500/40 bg-rose-500/10'
              }`}
            >
              <span className={r.ok ? 'text-emerald-300' : 'text-rose-300'}>{r.tempC}°C</span> ·{' '}
              {r.assetName} · {r.actor}
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
