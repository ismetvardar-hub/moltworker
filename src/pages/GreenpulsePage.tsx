import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/greenpulse'

export default function GreenpulsePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchGreenPulse())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }
  useEffect(() => {
    void refresh()
  }, [])
  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Yeşil & Arazi</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">ESG nabız — orman · su · güneş · karbon.</p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title="ESG skoru">
            <p className="text-3xl font-semibold text-lykia-200">{data.summary?.score}</p>
            <p className="text-xs text-slate-500">
              Alert {data.summary?.alerts} · Watch {data.summary?.watch} · Orman {data.summary?.forest_ha} ha · Güneş{' '}
              {data.summary?.solar_kwh} kWh
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.recordGreenMeter({ kind: 'solar', value: 920 }).then(() => {
                    ping('Güneş okuma')
                    return refresh()
                  })
                }
              >
                Güneş +920
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.addGreenIncident({ title: 'Dere kenarı temizlik turu', kind: 'water' }).then(() => {
                    ping('Saha notu')
                    return refresh()
                  })
                }
              >
                Saha notu
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.runGreenPulseAutomations({}).then((r: any) => {
                    ping(`ESG playbook ${r.actions?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                ESG playbook
              </button>
            </div>
          </PanelCard>
          <PanelCard title="Sayaçlar">
            <ul className="space-y-2 text-sm">
              {(data.meters || []).map((m: any) => (
                <li key={m.id} className="flex justify-between rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  <span>
                    {m.label}
                    <span className="ml-2 text-xs text-slate-500">
                      {m.value} {m.unit} / hedef {m.target}
                    </span>
                  </span>
                  <span
                    className={
                      m.status === 'alert'
                        ? 'text-xs text-rose-300'
                        : m.status === 'watch'
                          ? 'text-xs text-amber-300'
                          : 'text-xs text-emerald-300'
                    }
                  >
                    {m.status}
                  </span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
