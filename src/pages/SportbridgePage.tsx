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
              {data.summary?.licensed_links} · clearance gap {data.summary?.clearance_gaps ?? 0} · sakat{' '}
              {data.summary?.injured_links ?? 0}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {(data.links || []).map((l: any) => (
                <li key={l.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {l.member_name} ↔ {l.athlete_name}
                  <div className="text-xs text-slate-500">
                    {l.sport} · {l.segment || '—'} · waiver {l.waiver_ok ? 'ok' : 'eksik'} · clearance{' '}
                    {l.medical_clearance || '—'}
                    {l.injured ? ' · injured' : ''}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.gateSportSlotAccess({ extreme_user: 'guest_can' }).then((r: any) => {
                    ping(r.ok ? `Gate ${r.status}` : `Gate block · ${(r.issues || []).join('+')}`)
                    return refresh()
                  })
                }
              >
                Slot kapısı
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.syncSlotToSession({ force: true }).then((r: any) => {
                    ping(r.ok ? 'Slot → seans yazıldı' : r.error || 'Sync yok')
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
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.applySportCompetitionHold({ hours: 48 }).then((r: any) => {
                    ping(r.ok ? `Post-comp hold · ${r.hold?.athlete_id}` : r.error || 'Hold yok')
                    return refresh()
                  })
                }
              >
                Post-comp hold
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.completeBridgeRecovery({}).then((r: any) => {
                    ping(r.ok ? 'Recovery close' : r.error || 'Close yok')
                    return refresh()
                  })
                }
              >
                Recovery close
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runSportPostCompSweep({ force: true }).then((r: any) => {
                    ping(`Post-comp sweep · ${r.sweep?.created ?? 0}`)
                    return refresh()
                  })
                }
              >
                Post-comp sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100"
                onClick={() =>
                  void api.snoozeSportHold({ minutes: 30 }).then((r: any) => {
                    ping(r.ok ? 'Hold snooze' : r.error || 'Snooze yok')
                    return refresh()
                  })
                }
              >
                Hold snooze
              </button>
              <button
                type="button"
                className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-100"
                onClick={() =>
                  void api.wakeSportHolds({ force: true }).then((r: any) => {
                    ping(`Hold wake ${r.woken?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                Hold wake
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.escalateSportGate({ extreme_user: 'guest_can' }).then((r: any) => {
                    ping(r.ok ? 'Gate escalate' : r.error || 'Esc yok')
                    return refresh()
                  })
                }
              >
                Gate escalate
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-700 px-3 py-2 text-sm text-slate-200"
                onClick={() =>
                  void api.archiveSportBridgeLink({ reason: 'ops archive' }).then((r: any) => {
                    ping(r.ok ? 'Link arşiv' : r.error || 'Arşiv yok')
                    return refresh()
                  })
                }
              >
                Link arşiv
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Comp hold {data.summary?.competition_holds ?? 0} · snooze {data.summary?.holds_snoozed ?? 0} ·
              gate esc {data.summary?.gate_escalations ?? 0} · arşiv {data.summary?.links_archived ?? 0} ·
              recovery {data.summary?.recovery_closeouts ?? 0}
            </p>
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
