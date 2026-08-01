import { useEffect, useState } from 'react'
import { CAMPUS_DOMAINS, CORE_NAV_IDS } from '../nav/campusDomains'
import PanelCard from '../components/PanelCard'
import { fetchCampusBrief, runCampusAutomations, syncCampusBriefActions } from '../services/campusbrief'
import { campusCapacityRollup } from '../services/campuscore'
import { runAgentQueueSlaSweep } from '../services/agentqueue'
import { runGreenPulseAutomations } from '../services/greenpulse'
import { agentBridgeBroadcast } from '../services/agentbridge'

/**
 * Kampüs haritası — vizyon domain hub’ları + canlı nabız + hızlı ops.
 */
export default function CampusMapPage() {
  const [brief, setBrief] = useState<any>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setBrief(await fetchCampusBrief())
    } catch {
      setBrief(null)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  function go(pageId: string) {
    window.location.hash = `/${pageId}`
  }
  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }

  const p = brief?.pulses || {}

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs Haritası</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Extreme Yaşam & Deneyim Kampüsü</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Orman arazisi · spor · konaklama · açık AVM · kulüp · aile · ajan komuta. Menü sade: domain seç, Lab’dan eski
          ince modüllere in.
        </p>
      </header>

      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}

      {brief && (
        <PanelCard title="Canlı nabız">
          <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300 sm:grid-cols-4 lg:grid-cols-6">
            <div>
              <dt className="text-xs text-slate-500">ESG</dt>
              <dd className="text-lykia-200">{p.green?.score ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Stay boş</dt>
              <dd>{p.stay?.free ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Extreme slot</dt>
              <dd>{p.extreme?.open_slots ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Ajan kuyruk</dt>
              <dd>{p.queue?.queued ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Life flag</dt>
              <dd>{p.life?.flags ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Brif aksiyon</dt>
              <dd>{brief.actions?.length ?? '—'}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-lykia-500/90 px-3 py-1.5 text-xs text-obsidian-950"
              onClick={() => go('campusbrief')}
            >
              CEO Brif
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() => go('agentfleet')}
            >
              Ajan Filosu
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() => go('readiness')}
            >
              Hazırlık
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() =>
                void runCampusAutomations().then((r: any) => {
                  ping(`Otomasyon ${r.actions?.length ?? 0}`)
                  return refresh()
                })
              }
            >
              Çapraz oto
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() =>
                void syncCampusBriefActions().then((r: any) => {
                  ping(`Kayıt +${r.created?.length ?? 0}`)
                  return refresh()
                })
              }
            >
              Brif sync
            </button>
            <button
              type="button"
              className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs text-amber-100"
              onClick={() =>
                void runAgentQueueSlaSweep({ force: true }).then((r: any) => {
                  ping(`SLA esc ${r.escalated?.length ?? 0}`)
                  return refresh()
                })
              }
            >
              SLA sweep
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() =>
                void runGreenPulseAutomations({}).then((r: any) => {
                  ping(`ESG ${r.actions?.length ?? 0}`)
                  return refresh()
                })
              }
            >
              ESG playbook
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() =>
                void campusCapacityRollup().then((r: any) => {
                  ping(`Kapasite %${r.rollup?.stay_occ_pct}`)
                  return refresh()
                })
              }
            >
              Kapasite
            </button>
            <button
              type="button"
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs"
              onClick={() =>
                void agentBridgeBroadcast({ title: 'Harita broadcast' }).then((r: any) => {
                  ping(`Broadcast ${r.broadcast?.targets?.length ?? 0}`)
                  return refresh()
                })
              }
            >
              Broadcast
            </button>
          </div>
        </PanelCard>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CAMPUS_DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => go(d.primary)}
            className="rounded-2xl border border-obsidian-700 bg-obsidian-900/80 p-4 text-left transition hover:border-lykia-500/40 hover:bg-obsidian-800/80"
          >
            <h2 className="text-base font-semibold text-lykia-200">{d.label}</h2>
            <p className="mt-1 text-xs text-slate-400">{d.description}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">Giriş → {d.primary}</p>
          </button>
        ))}
      </div>

      <PanelCard title="Hızlı çekirdek">
        <div className="flex flex-wrap gap-2">
          {CORE_NAV_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-lykia-500/20 hover:text-lykia-200"
            >
              {id}
            </button>
          ))}
        </div>
      </PanelCard>
    </div>
  )
}
