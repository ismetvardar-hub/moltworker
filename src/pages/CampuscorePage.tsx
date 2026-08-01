import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/campuscore'

export default function CampuscorePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchCampusCore()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kampüs Omurga</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Arazi zonları — spor, konaklama, AVM, kültür, orman koruma.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Özet">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div><dt className="text-xs text-slate-500">Toplam ha</dt><dd className="text-lg text-lykia-200">{data.summary?.total_ha}</dd></div>
              <div><dt className="text-xs text-slate-500">Aktif zon</dt><dd className="text-lg">{data.summary?.active}</dd></div>
              <div><dt className="text-xs text-slate-500">İnşaat</dt><dd>{data.summary?.build}</dd></div>
              <div><dt className="text-xs text-slate-500">Koruma</dt><dd>{data.summary?.protected}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">{data.ethos}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api
                    .addCampusIncident({ title: 'Saha turu notu', zone_id: 'z_forest', severity: 'info' })
                    .then(() => {
                      ping('Saha notu kaydedildi')
                      return refresh()
                    })
                }
              >
                Saha notu ekle
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.resolveCampusIncident({}).then(() => {
                    ping('Incident resolved')
                    return refresh()
                  })
                }
              >
                Incident kapat
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.campusCapacityRollup().then((r: any) => {
                    ping(`Kapasite stay %${r.rollup?.stay_occ_pct}`)
                    return refresh()
                  })
                }
              >
                Kapasite rollup
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api
                    .createCampusWorkOrder({ zone_id: 'z_sport', title: 'Zemin bakım' })
                    .then((r: any) => {
                      ping(r.ok ? `WO · ${r.work_order?.title}` : r.error || 'WO yok')
                      return refresh()
                    })
                }
              >
                İş emri aç
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runCampusWorkOrderSweep({ force: true }).then((r: any) => {
                    ping(`WO sweep · ${r.sweep?.created ?? 0}`)
                    return refresh()
                  })
                }
              >
                WO sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api
                    .assignCampusWorkOrder({ assignee: 'saha-ekip-1', agent: 'HEPHAESTUS' })
                    .then((r: any) => {
                      ping(r.ok ? `WO ata · ${r.work_order?.assignee}` : r.error || 'WO yok')
                      return refresh()
                    })
                }
              >
                WO ata
              </button>
              <button
                type="button"
                className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100"
                onClick={() =>
                  void api.startCampusWorkOrder({}).then((r: any) => {
                    ping(r.ok ? 'WO başladı' : r.error || 'WO yok')
                    return refresh()
                  })
                }
              >
                WO başlat
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.escalateCampusWorkOrder({ reason: 'sla_risk' }).then((r: any) => {
                    ping(
                      r.ok
                        ? `WO escalate · ${r.escalation?.to_priority}`
                        : r.error || 'WO yok',
                    )
                    return refresh()
                  })
                }
              >
                WO escalate
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.completeCampusWorkOrder({}).then((r: any) => {
                    ping(r.ok ? 'WO tamam' : r.error || 'WO yok')
                    return refresh()
                  })
                }
              >
                WO tamamla
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.escalateCampusIncident({ reason: 'ops' }).then((r: any) => {
                    ping(r.ok ? `Inc escalate · ${r.escalation?.to_severity}` : r.error || 'Inc yok')
                    return refresh()
                  })
                }
              >
                Incident escalate
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.lockdownCampusZone({ zone_id: 'z_sport', reason: 'safety', force: true }).then((r: any) => {
                    ping(r.ok ? `Lockdown · ${r.zone?.name}` : r.error || 'Lock yok')
                    return refresh()
                  })
                }
              >
                Zon lockdown
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.clearCampusZoneLockdown({ zone_id: 'z_sport' }).then((r: any) => {
                    ping(r.ok ? 'Lockdown kalktı' : r.error || 'Clear yok')
                    return refresh()
                  })
                }
              >
                Lockdown kaldır
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.runCampusCapacityAlertSweep({ force: true, threshold: 50 }).then((r: any) => {
                    ping(`Cap alert · ${r.sweep?.alerts ?? 0}`)
                    return refresh()
                  })
                }
              >
                Kapasite alert
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Açık incident {data.summary?.open_incidents ?? 0} · açık WO{' '}
              {data.summary?.open_work_orders ?? 0} · atanan {data.summary?.assigned_work_orders ?? 0}{' '}
              · devam {data.summary?.in_progress_work_orders ?? 0} · lockdown {data.summary?.locked_zones ?? 0} ·
              cap alert {data.summary?.capacity_alerts ?? 0}
            </p>
          </PanelCard>
          <PanelCard title="Zonlar">
            <ul className="space-y-2 text-sm">
              {(data.zones || []).map((z: any) => (
                <li key={z.id} className="flex items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
                  <span className="text-slate-200">
                    {z.name}
                    <span className="ml-2 text-xs text-slate-500">
                      {z.hectares} ha · {z.kind}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-lykia-300">
                      {z.status}
                      {z.lockdown ? ' · LOCK' : ''}
                    </span>
                    {z.status !== 'protected' && z.status !== 'active' && (
                      <button
                        type="button"
                        className="rounded bg-obsidian-800 px-2 py-0.5 text-[10px]"
                        onClick={() =>
                          void api.transitionCampusZone({ zone_id: z.id }).then(() => {
                            ping(`${z.name} geçiş`)
                            return refresh()
                          })
                        }
                      >
                        İlerlet
                      </button>
                    )}
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
