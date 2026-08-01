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
            <p className="mt-1 text-xs text-slate-500">
              Bugün POS {data.summary?.day_tickets ?? 0} işlem · {data.summary?.day_sales_try?.toLocaleString?.('tr-TR') ?? data.summary?.day_sales_try} TRY
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.recordMallSale({ tenant_id: 'mt_4', amount_try: 850 }).then(() => {
                    ping('Trail Kitchen +850')
                    return refresh()
                  })
                }
              >
                Trail Kitchen satış +850
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.mallDayRollup().then((r: any) => {
                    ping(`Gün rollup ${r.rollup?.total_try ?? 0} TRY`)
                    return refresh()
                  })
                }
              >
                Günlük rollup
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.settleMallTenantFnb({ tenant_id: 'mt_4' }).then((r: any) => {
                    ping(`F&B settle gap ${r.settlement?.after_gap}`)
                    return refresh()
                  })
                }
              >
                Trail Kitchen F&B settle
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.generateMallRentRun({}).then((r: any) => {
                    ping(r.ok ? `Kira run · ${r.created?.length ?? 0} fatura` : r.error || 'Kira run yok')
                    return refresh()
                  })
                }
              >
                Kira faturası üret
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.payMallInvoice({}).then((r: any) => {
                    ping(r.ok ? `Tahsil · ${r.payment?.amount_try} TRY` : r.error || 'Fatura yok')
                    return refresh()
                  })
                }
              >
                Fatura tahsil
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runMallDunningSweep({ force: true }).then((r: any) => {
                    ping(`Dunning · ${r.sweep?.overdue ?? 0}`)
                    return refresh()
                  })
                }
              >
                Dunning sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/25 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.generateMallCamRun({ force: true }).then((r: any) => {
                    ping(
                      r.ok
                        ? `CAM · ${r.run?.invoices ?? 0} · ${r.run?.total_try ?? 0} TRY`
                        : r.error || 'CAM yok',
                    )
                    return refresh()
                  })
                }
              >
                CAM run
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/30 px-3 py-2 text-sm text-rose-50"
                onClick={() =>
                  void api.holdMallLease({ force: true }).then((r: any) => {
                    ping(r.ok ? `Hold · ${r.tenant?.name}` : r.error || 'Hold yok')
                    return refresh()
                  })
                }
              >
                Lease hold
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.releaseMallLease({}).then((r: any) => {
                    ping(r.ok ? `Release · ${r.tenant?.name}` : r.error || 'Release yok')
                    return refresh()
                  })
                }
              >
                Lease release
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.disputeMallInvoice({ reason: 'ui_dispute' }).then((r: any) => {
                    ping(r.ok ? `İtiraz · ${r.dispute?.amount_try} TRY` : r.error || 'Dispute yok')
                    return refresh()
                  })
                }
              >
                Fatura itiraz
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.pauseMallTenant({ force: true }).then((r: any) => {
                    ping(r.ok ? `Pause · ${r.tenant?.name}` : r.error || 'Pause yok')
                    return refresh()
                  })
                }
              >
                Kiracı pause
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.resumeMallTenant({}).then((r: any) => {
                    ping(r.ok ? `Resume · ${r.tenant?.name}` : r.error || 'Resume yok')
                    return refresh()
                  })
                }
              >
                Kiracı resume
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Açık fatura {data.summary?.invoices_open ?? 0} · gecikmiş {data.summary?.invoices_overdue ?? 0} · bakiye{' '}
              {data.summary?.invoices_balance_try?.toLocaleString?.('tr-TR') ?? 0} TRY · hold{' '}
              {data.summary?.lease_holds_open ?? 0} · on-hold kiracı {data.summary?.on_hold ?? 0} · dispute{' '}
              {data.summary?.invoices_disputed ?? 0} · paused {data.summary?.tenants_paused ?? 0}
            </p>
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
