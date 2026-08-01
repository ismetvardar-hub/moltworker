import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/sportbridge'

export default function SportbridgePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchSportBridge())
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Spor Köprüsü</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Extreme Park slot ↔ kulüp seansı · waiver ↔ lisans.</p>
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
          <PanelCard title="Köprüler">
            <p className="text-sm text-slate-300">
              Linked {data.summary?.linked} · Waiver gap {data.summary?.waiver_gaps} · Lisanslı{' '}
              {data.summary?.licensed_links}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {(data.links || []).map((l: any) => (
                <li key={l.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {l.member_name} ↔ {l.athlete_name}
                  <div className="text-xs text-slate-500">
                    {l.sport} · {l.segment || '—'} · waiver {l.waiver_ok ? 'ok' : 'eksik'}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.syncSlotToSession({}).then(() => {
                    ping('Slot → seans yazıldı')
                    return refresh()
                  })
                }
              >
                Slot → seans
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.bridgeRecoveryPlan({}).then(() => {
                    ping('Recovery planı')
                    return refresh()
                  })
                }
              >
                Recovery plan
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.runSportEligibilitySweep({}).then((r: any) => {
                    ping(`Eligibilite ${r.summary?.flagged ?? 0} bayrak`)
                    return refresh()
                  })
                }
              >
                Eligibility sweep
              </button>
            </div>
          </PanelCard>
          <PanelCard title="Park nabız">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Açık slot</dt>
                <dd className="text-lg text-lykia-200">{data.extreme?.open_slots}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Waiver bekleyen</dt>
                <dd className="text-lg">{data.extreme?.waiver_pending}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kulüp aktif</dt>
                <dd>{data.club?.active}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Plan aktif</dt>
                <dd>{data.club?.plans_active}</dd>
              </div>
            </dl>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
