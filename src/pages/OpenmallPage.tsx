import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/openmall'

export default function OpenmallPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchOpenMall())
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Açık AVM</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Kiracı · kira roll · F&B asgari harcama.</p>
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
          <PanelCard title="Kira & F&B">
            <p className="text-2xl font-semibold text-lykia-200">
              {data.summary?.rent_roll?.toLocaleString?.('tr-TR') ?? data.summary?.rent_roll} TRY
            </p>
            <p className="text-xs text-slate-500">
              Aktif {data.summary?.active} · Fit-out {data.summary?.fitout} · F&B hedef {data.summary?.fnb_met}/
              {data.summary?.fnb_targets} · gap {data.summary?.fnb_gap_total?.toLocaleString?.('tr-TR')} TRY
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
              onClick={() =>
                void api.recordMallSale({ tenant_id: 'mt_4', amount_try: 850 }).then(() => {
                  ping('Trail Kitchen +850')
                  return refresh()
                })
              }
            >
              Trail Kitchen satış +850
            </button>
          </PanelCard>
          <PanelCard title="Kiracılar">
            <ul className="space-y-2 text-sm">
              {(data.tenants || []).map((t: any) => (
                <li key={t.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {t.name} · {t.unit}
                  <div className="text-xs text-slate-500">
                    {t.category} · kira {t.rent_try} · {t.status}
                    {t.fnb_min_try > 0
                      ? ` · F&B %${t.fnb_pct} (${t.fnb_spend_try}/${t.fnb_min_try})${t.fnb_met ? ' ✓' : ''}`
                      : ''}
                  </div>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
