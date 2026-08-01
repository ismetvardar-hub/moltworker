import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  fetchColdchain,
  logCold,
  type ColdAsset,
  type ColdReading,
} from '../services/coldchain'

export default function ColdchainPage() {
  const [assets, setAssets] = useState<ColdAsset[]>([])
  const [readings, setReadings] = useState<ColdReading[]>([])
  const [alerts, setAlerts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [assetId, setAssetId] = useState('')
  const [tempC, setTempC] = useState(3)

  async function refresh() {
    try {
      const data = await fetchColdchain()
      setAssets(data.assets)
      setReadings(data.readings)
      setAlerts(data.recentAlerts)
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
