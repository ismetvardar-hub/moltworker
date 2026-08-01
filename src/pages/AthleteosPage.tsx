import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/athleteos'

export default function AthleteosPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchAthleteOs())
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
  const trial = (data?.athletes || []).find((a: any) => a.status === 'trial' || !a.license)
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kulüp & Sporcu OS</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Lisans · antrenman planı · seans · readiness (RPE × recovery).
        </p>
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
          <PanelCard title="Kadro & Readiness">
            <p className="text-sm text-slate-300">
              Aktif {data.summary?.active} · Lisanslı {data.summary?.licensed} · Deneme {data.summary?.trial} · Ort.
              readiness {data.summary?.avg_readiness ?? '—'}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {(data.athletes || []).map((a: any) => {
                const r = (data.readiness || []).find((x: any) => x.athlete_id === a.id)
                return (
                  <li key={a.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                    <div className="flex justify-between gap-2">
                      <span>
                        {a.name} · {a.sport} · {a.level}
                      </span>
                      <span
                        className={
                          r?.flag === 'watch'
                            ? 'text-amber-300'
                            : r?.flag === 'monitor'
                              ? 'text-lykia-300'
                              : 'text-emerald-300'
                        }
                      >
                        {r?.score ?? '—'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.license || 'lisanssız'}
                      {a.license_expires ? ` · bitiş ${a.license_expires}` : ''} · RPE {r?.avg_rpe ?? '—'} · rec{' '}
                      {r?.recovery ?? '—'}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.issueAthleteLicense({ athlete_id: trial?.id || 'ath_3' }).then(() => {
                    ping('Lisans verildi')
                    return refresh()
                  })
                }
              >
                Lisans ver / yenile
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.logAthleteSession({ athlete_id: 'ath_1', session: 'Tempo', rpe: 7 }).then(() => {
                    ping('Seans kaydı')
                    return refresh()
                  })
                }
              >
                Seans log
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.setAthleteClearance({ athlete_id: trial?.id || 'ath_3', status: 'cleared' }).then(() => {
                    ping('Tıbbi clearance')
                    return refresh()
                  })
                }
              >
                Clearance ver
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api
                    .reportAthleteInjury({
                      athlete_id: 'ath_1',
                      body_area: 'diz',
                      severity: 'moderate',
                    })
                    .then((r: any) => {
                      ping(r.ok ? `Sakatlık · ${r.injury?.body_area}` : r.error || 'Injury yok')
                      return refresh()
                    })
                }
              >
                Sakatlık bildir
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.advanceReturnToPlay({ force: true }).then((r: any) => {
                    ping(r.ok ? `RTP → ${r.injury?.rtp_stage}` : r.error || 'RTP yok')
                    return refresh()
                  })
                }
              >
                RTP ilerlet
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runAthleteRtpSweep({ force: true }).then((r: any) => {
                    ping(`RTP sweep · ${r.sweep?.flagged ?? 0}`)
                    return refresh()
                  })
                }
              >
                RTP sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/80 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api
                    .registerAthleteCompetition({ athlete_id: 'ath_1', title: 'Likya Cup' })
                    .then((r: any) => {
                      ping(r.ok ? `Yarışma · ${r.competition?.title}` : r.error || 'Kayıt yok')
                      return refresh()
                    })
                }
              >
                Yarışma kaydı
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/25 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.clearAthleteForCompetition({ athlete_id: 'ath_1' }).then((r: any) => {
                    ping(
                      r.ok
                        ? `Yarışma OK · ${r.clearance?.status}`
                        : r.error || `Blok · ${(r.clearance?.gaps || []).join(',')}`,
                    )
                    return refresh()
                  })
                }
              >
                Yarışma clearance
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.runAthleteCompetitionClearanceSweep({ force: true }).then((r: any) => {
                    ping(`Yarışma sweep · ${r.sweep?.cleared ?? 0}/${r.sweep?.blocked ?? 0}`)
                    return refresh()
                  })
                }
              >
                Yarışma sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.assignAthleteCoach({ athlete_id: 'ath_3', coach_name: 'Coach Mira' }).then((r: any) => {
                    ping(r.ok ? `Coach · ${r.assignment?.coach_name}` : r.error || 'Coach yok')
                    return refresh()
                  })
                }
              >
                Antrenör ata
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.placeAthleteMedicalHold({ athlete_id: 'ath_3', days: 3 }).then((r: any) => {
                    ping(r.ok ? `Med hold · ${r.hold?.reason}` : r.error || 'Hold yok')
                    return refresh()
                  })
                }
              >
                Medikal hold
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.clearAthleteMedicalHold({ athlete_id: 'ath_3' }).then((r: any) => {
                    ping(r.ok ? 'Med hold kalktı' : r.error || 'Clear yok')
                    return refresh()
                  })
                }
              >
                Hold kaldır
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Clearance {data.summary?.cleared ?? 0} · gap {data.summary?.clearance_gap ?? 0} · sakat{' '}
              {data.summary?.injured ?? 0} · açık injury {data.summary?.open_injuries ?? 0} · yarışma{' '}
              {data.summary?.competitions_open ?? 0} · OK {data.summary?.competition_cleared ?? 0} · med hold{' '}
              {data.summary?.medical_holds ?? 0}
            </p>
          </PanelCard>
          <PanelCard title="Haftalık planlar">
            <ul className="space-y-2 text-sm">
              {(data.plans || []).map((p: any) => (
                <li key={p.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {p.athlete_id} · {p.focus}
                  <div className="text-xs text-slate-500">{(p.sessions || []).join(' · ')}</div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
              onClick={() =>
                void api.upsertAthletePlan({ focus: 'Recovery', sessions: 'Yoga, Nefes' }).then(() => {
                  ping('Plan güncellendi')
                  return refresh()
                })
              }
            >
              Recovery planı yaz
            </button>
            <p className="mt-3 text-xs text-slate-500">Son seanslar: {data.summary?.sessions_logged ?? 0}</p>
            <ul className="mt-1 max-h-32 space-y-1 overflow-auto text-[11px] text-slate-400">
              {(data.sessions || []).slice(0, 8).map((s: any) => (
                <li key={s.id}>
                  {s.athlete_id} · {s.session} · RPE {s.rpe}
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
