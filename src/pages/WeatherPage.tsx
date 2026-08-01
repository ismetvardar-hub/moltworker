import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchWeather, refreshWeather } from '../services/weather'

export default function WeatherPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  async function load() {
    try { setData(await fetchWeather()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
  }
  useEffect(() => { void load() }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Hava Brifi</h1>
        <p className="mt-1 text-sm text-slate-400">Sahil operasyon ipucu.</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <PanelCard title={data.label}>
          <p className="text-sm text-slate-300">{data.tempC}°C · rüzgar {data.windKph} km/s · nem %{data.humidity}</p>
          <p className="mt-2 text-sm text-lykia-300">{data.tip}</p>
          <button type="button" className="mt-3 rounded-md bg-lykia-500/90 px-3 py-1.5 text-xs text-obsidian-950"
            onClick={() => void refreshWeather().then(setData).catch((e) => setError(String(e.message||e)))}>Yenile</button>
        </PanelCard>
      )}
    </div>
  )
}
