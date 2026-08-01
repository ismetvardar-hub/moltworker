import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  applyExtremeWeatherHold,
  cancelExtremeReservation,
  checkInExtremeReservation,
  clearExtremeWeatherHold,
  createExtremeMaas,
  expireExtremeWaitlist,
  extremeWalletSpend,
  fetchExtremeOverview,
  fetchExtremeUserSpec,
  issueExtremeGear,
  joinExtremeWaitlist,
  markExtremeNoShow,
  patchExtremeGear,
  promoteExtremeWaitlist,
  renewExtremeMaas,
  reserveExtremeSlot,
  returnExtremeGear,
  runExtremeGearServiceSweep,
  runExtremeWeatherCheck,
  runExtremeWeatherHoldSweep,
  signExtremeWaiver,
  topUpExtremeWallet,
} from '../services/extremepark'

type Tab = 'hub' | 'vision'

export default function ExtremeParkPage() {
  const [tab, setTab] = useState<Tab>('hub')
  const [overview, setOverview] = useState<any>(null)
  const [spec, setSpec] = useState<any>(null)
  const [userId, setUserId] = useState('guest_can')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [maas, setMaas] = useState<any>(null)
  const [weatherResult, setWeatherResult] = useState<any>(null)

  async function refresh() {
    try {
      const [o, s] = await Promise.all([fetchExtremeOverview(), fetchExtremeUserSpec(userId)])
      setOverview(o)
      setSpec(s)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }

  useEffect(() => {
    void refresh()
  }, [userId])

  function ping(msg: string) {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3200)
  }

  async function onWaiver() {
    try {
      const res = await signExtremeWaiver({ user_id: userId, channel: 'daze_vision' })
      if (!(res as any).ok) throw new Error((res as any).error || 'Waiver başarısız')
      setSpec((res as any).user_spec)
      ping('Feragatname imzalandı — ETHOS onayladı, NEXUS kapıyı ısıttı.')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Waiver hata')
    }
  }

  async function onWeather(force?: string) {
    try {
      const res = await runExtremeWeatherCheck(force ? { force_condition: force } : {})
      setWeatherResult(res)
      setOverview((o: any) => (o ? { ...o, slots: (res as any).slots, weather: (res as any).weather } : o))
      ping(
        `Hava kontrol: ${(res as any).cancelled_slots?.length || 0} slot iptal · ${(res as any).whatsapp_notices?.length || 0} WA (REMINDER-AI)`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hava kontrol hata')
    }
  }

  async function onMaas(kind: string) {
    try {
      const res = await createExtremeMaas({ user_id: userId, kind })
      if (!(res as any).ok) throw new Error((res as any).error || 'MaaS başarısız')
      setMaas((res as any).maas)
      ping(`MaaS QR hazır (${kind}) — indir, gülümse, tekrar uç.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'MaaS hata')
    }
  }

  async function onSpend() {
    try {
      const res = await extremeWalletSpend({ user_id: userId, amount: 150 })
      if (!(res as any).ok) throw new Error((res as any).error || 'Harcama başarısız')
      setSpec((res as any).user_spec)
      ping('NFC cüzdan −150 TRY · F&B asgariye bir adım daha.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cüzdan hata')
    }
  }

  const w = overview?.weather
  const summary = overview?.summary

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">
          AŞAMA 321–325 · Extreme Park
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">
          Antalya Extreme · Yaşam & Deneyim Parkı
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          {overview?.ethos ||
            'Omni-channel spor arenası: waiver, hava oto-iptal, MaaS, NFC cüzdan, HEPHAESTUS zimmet.'}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setTab('hub')}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'hub' ? 'bg-lykia-500/90 text-obsidian-950' : 'bg-obsidian-800 text-slate-300'}`}
          >
            Daze Hub Komuta
          </button>
          <button
            type="button"
            onClick={() => setTab('vision')}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === 'vision' ? 'bg-lykia-500/90 text-obsidian-950' : 'bg-obsidian-800 text-slate-300'}`}
          >
            Daze Vision Müşteri
          </button>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-lg border border-obsidian-600 bg-obsidian-950 px-2 py-1.5 text-sm text-slate-200"
          >
            <option value="guest_can">Can · Platinum</option>
            <option value="guest_ela">Ela · Günübirlik</option>
          </select>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}

      {tab === 'hub' && overview && (
        <div className="grid gap-4 lg:grid-cols-3">
          <PanelCard title="Hava Güvenlik Radarı">
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <span className="text-lykia-300">{w?.label || w?.condition}</span> · {w?.tempC}°C · rüzgar{' '}
                {w?.windKph} km/s
              </p>
              <p className="text-xs text-slate-500">{w?.tip}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md bg-obsidian-800 px-2 py-1 text-xs text-slate-200"
                  onClick={() => void onWeather()}
                >
                  Canlı kontrol
                </button>
                <button
                  type="button"
                  className="rounded-md bg-amber-500/20 px-2 py-1 text-xs text-amber-200"
                  onClick={() => void onWeather('windy')}
                >
                  Simüle: rüzgar
                </button>
                <button
                  type="button"
                  className="rounded-md bg-sky-500/20 px-2 py-1 text-xs text-sky-200"
                  onClick={() => void onWeather('rain')}
                >
                  Simüle: yağış
                </button>
                <button
                  type="button"
                  className="rounded-md bg-amber-500/30 px-2 py-1 text-xs text-amber-100"
                  onClick={() =>
                    void applyExtremeWeatherHold({ force_condition: 'windy', minutes: 60 }).then((r: any) => {
                      ping(`Hold ${r.held?.length || 0} slot`)
                      return refresh()
                    })
                  }
                >
                  Hold 60dk
                </button>
                <button
                  type="button"
                  className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200"
                  onClick={() =>
                    void runExtremeWeatherHoldSweep({ force_clear: true, force_hold: true, force_condition: 'windy' }).then(
                      (r: any) => {
                        ping(`Weather sweep · hold ${r.sweep?.held ?? 0}`)
                        return refresh()
                      },
                    )
                  }
                >
                  Weather sweep
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-100"
                  onClick={() =>
                    void clearExtremeWeatherHold({}).then((r: any) => {
                      ping(`Hold clear ${r.cleared?.length || 0}`)
                      return refresh()
                    })
                  }
                >
                  Hold clear
                </button>
              </div>
              {weatherResult && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
                  <li>İptal: {weatherResult.cancelled_slots?.length || 0} slot</li>
                  <li>WhatsApp kuyruk: {weatherResult.whatsapp_notices?.length || 0}</li>
                </ul>
              )}
            </div>
          </PanelCard>

          <PanelCard title="Oto-İptal Konsolu">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Açık slot</dt>
                <dd className="text-lg text-lykia-200">{summary?.open_slots ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Hava iptal</dt>
                <dd className="text-lg text-amber-200">{summary?.cancelled_slots ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Waiver bekleyen</dt>
                <dd className="text-lg text-slate-200">{summary?.waiver_pending ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ekipman servis</dt>
                <dd className="text-lg text-slate-200">{summary?.gear_service ?? '—'}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              REMINDER-AI iptalde WA yollar; MINT dolulukta fiyatı fısıldar; NEXUS ışığı kısar.
            </p>
          </PanelCard>

          <PanelCard title="Ajan Filosu">
            <ul className="space-y-1.5 text-xs text-slate-300">
              {Object.entries(overview.agents || {}).map(([k, v]) => (
                <li key={k}>
                  <span className="font-semibold text-lykia-300">{k}</span> — {String(v)}
                </li>
              ))}
            </ul>
          </PanelCard>

          <div className="lg:col-span-3">
            <PanelCard title="Branş Slot Ritmi">
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-400">
                {(overview.branches || []).map((b: any) => (
                  <span key={b.id} className="rounded-md border border-obsidian-600 px-2 py-1">
                    {b.title} · {b.rhythm}
                    {b.weatherSensitive ? ' · hava hassas' : ''}
                  </span>
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                {(overview.slots || []).map((s: any) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2"
                  >
                    <div className="text-slate-200">
                      <span className="font-medium capitalize">{s.branch}</span> · {s.slot_start}
                      <span className="ml-2 text-xs text-slate-500">
                        {s.booked}/{s.capacity}
                      </span>
                      {s.cancel_reason ? (
                        <div className="text-xs text-amber-300">{s.cancel_reason}</div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-lykia-500/80 px-2 py-0.5 text-[10px] text-obsidian-950"
                        onClick={() =>
                          void reserveExtremeSlot({ user_id: userId, slot_id: s.id }).then((r: any) => {
                            if (!r.ok) throw new Error(r.error || 'Rezervasyon başarısız')
                            ping(`Rezerve · ${s.branch}`)
                            return refresh()
                          }).catch((e: Error) => setError(e.message))
                        }
                      >
                        Rezerve
                      </button>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                          s.status === 'cancelled_weather'
                            ? 'bg-amber-500/20 text-amber-200'
                            : s.status === 'weather_hold'
                              ? 'bg-amber-500/30 text-amber-100'
                              : s.status === 'full'
                                ? 'bg-rose-500/20 text-rose-200'
                                : 'bg-emerald-500/20 text-emerald-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-obsidian-800 px-2 py-1 text-xs text-slate-300"
                  onClick={() =>
                    void cancelExtremeReservation({ user_id: userId }).then(() => {
                      ping('Rezervasyon iptal')
                      return refresh()
                    })
                  }
                >
                  Aktif rezervasyonu iptal
                </button>
                <button
                  type="button"
                  className="rounded-md bg-obsidian-800 px-2 py-1 text-xs text-slate-300"
                  onClick={() =>
                    void joinExtremeWaitlist({ user_id: userId }).then((r: any) => {
                      if (!r.ok) throw new Error(r.error || 'Waitlist')
                      ping('Waitlist')
                      return refresh()
                    }).catch((e: Error) => setError(e.message))
                  }
                >
                  Waitlist
                </button>
                <button
                  type="button"
                  className="rounded-md bg-lykia-500/80 px-2 py-1 text-xs text-obsidian-950"
                  onClick={() =>
                    void promoteExtremeWaitlist({}).then((r: any) => {
                      ping(r.reservation?.ok ? 'Waitlist → rezervasyon' : 'Promote denendi')
                      return refresh()
                    })
                  }
                >
                  Waitlist promote
                </button>
                <button
                  type="button"
                  className="rounded-md bg-emerald-500/25 px-2 py-1 text-xs text-emerald-100"
                  onClick={() =>
                    void checkInExtremeReservation({ user_id: userId, gate: 'main' }).then((r: any) => {
                      ping(r.ok ? `Check-in · ${r.reservation?.branch || ''}` : r.error || 'Check-in yok')
                      return refresh()
                    })
                  }
                >
                  Check-in
                </button>
                <button
                  type="button"
                  className="rounded-md bg-rose-500/20 px-2 py-1 text-xs text-rose-100"
                  onClick={() =>
                    void markExtremeNoShow({ user_id: userId, promote: true }).then((r: any) => {
                      ping(
                        r.ok
                          ? `No-show${r.promoted?.ok ? ' · waitlist promote' : ''}`
                          : r.error || 'No-show yok',
                      )
                      return refresh()
                    })
                  }
                >
                  No-show
                </button>
                <button
                  type="button"
                  className="rounded-md bg-obsidian-800 px-2 py-1 text-xs text-slate-300"
                  onClick={() =>
                    void expireExtremeWaitlist({ force: true }).then((r: any) => {
                      ping(`Waitlist expire · ${r.sweep?.expired ?? 0}`)
                      return refresh()
                    })
                  }
                >
                  Waitlist expire
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Waitlist: {summary?.waitlist ?? 0} · check-in {summary?.checked_in ?? 0} · no-show{' '}
                {summary?.no_show ?? 0}
              </p>
            </PanelCard>
          </div>

          <div className="lg:col-span-3">
            <PanelCard title="HEPHAESTUS · Kiralık Ekipman">
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-lykia-500/90 px-2 py-1 text-[11px] font-medium text-obsidian-950"
                  onClick={() =>
                    void issueExtremeGear({ user_id: userId }).then((r: any) => {
                      ping(r.ok ? `Verildi · ${r.gear?.serial}` : r.error || 'Verilemedi')
                      return refresh()
                    })
                  }
                >
                  Ekipman ver
                </button>
                <button
                  type="button"
                  className="rounded-md bg-amber-500/20 px-2 py-1 text-[11px] text-amber-100"
                  onClick={() =>
                    void runExtremeGearServiceSweep({ include_open: true }).then((r: any) => {
                      ping(`Servis sweep · ${r.sweep?.flagged ?? 0}`)
                      return refresh()
                    })
                  }
                >
                  Servis sweep
                </button>
                <span className="self-center text-[11px] text-slate-500">
                  ready {summary?.gear_ready ?? 0} · out {summary?.gear_out ?? 0} · overdue{' '}
                  {summary?.gear_overdue ?? 0}
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                {(overview.gear || []).map((g: any) => (
                  <li
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2"
                  >
                    <div className="text-slate-200">
                      {g.serial} · {g.kind}
                      <div className="text-xs text-slate-500">
                        {g.holder || 'rafta'} · servis {g.next_service}
                        {g.due_at ? ` · due ${String(g.due_at).slice(11, 16)}` : ''}
                        {g.service_flag ? ` · ${g.service_flag}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {['ready', 'out', 'service'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                          onClick={() =>
                            void patchExtremeGear(g.id, { status: st }).then(() => refresh())
                          }
                        >
                          {st}
                        </button>
                      ))}
                      {g.status === 'ready' && (
                        <button
                          type="button"
                          className="rounded-md bg-sky-500/20 px-2 py-1 text-[10px] text-sky-200"
                          onClick={() =>
                            void issueExtremeGear({ user_id: userId, gear_id: g.id }).then(
                              (r: any) => {
                                ping(r.ok ? `Verildi · ${g.serial}` : r.error || 'Verilemedi')
                                return refresh()
                              },
                            )
                          }
                        >
                          ver
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200"
                        onClick={() =>
                          void returnExtremeGear({ gear_id: g.id }).then(() => {
                            ping('İade')
                            return refresh()
                          })
                        }
                      >
                        iade
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-rose-500/20 px-2 py-1 text-[10px] text-rose-200"
                        onClick={() =>
                          void returnExtremeGear({ gear_id: g.id, damaged: true }).then(() => {
                            ping('Hasar → HEPHAESTUS')
                            return refresh()
                          })
                        }
                      >
                        hasar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>
        </div>
      )}

      {tab === 'vision' && spec && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title="Dijital Waiver">
            <p className="text-sm text-slate-300">
              {spec.user_profile?.display_name} ·{' '}
              {spec.rights?.waiver_ok ? (
                <span className="text-emerald-300">imzalı</span>
              ) : (
                <span className="text-amber-300">imza bekliyor</span>
              )}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              İmza olmadan Premium Extreme turnikesinden geçmek, rüzgâra küfretmek kadar nafile.
            </p>
            <button
              type="button"
              disabled={!!spec.rights?.waiver_ok}
              onClick={() => void onWaiver()}
              className="mt-3 rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 disabled:opacity-40"
            >
              Feragatnameyi imzala
            </button>
          </PanelCard>

          <PanelCard title="Segment & Haklar">
            <p className="text-lg text-lykia-200">{spec.segment?.label}</p>
            <p className="mt-1 text-xs text-slate-400">
              Bölgeler: {(spec.rights?.zones || []).join(', ')}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>VIP kapı: {spec.rights?.vip_gate ? 'açık' : 'kapalı'}</li>
              <li>MaaS: {spec.rights?.maas ? 'dahil' : 'yok'}</li>
              <li>
                Slot kota: {spec.quota_management?.weekly_used}/
                {spec.quota_management?.weekly_slots}
              </li>
              <li>
                Aktif rezervasyon:{' '}
                {spec.active_reservation
                  ? `${spec.active_reservation.branch} ${spec.active_reservation.slot_start}`
                  : 'yok'}
              </li>
            </ul>
          </PanelCard>

          <PanelCard title="NFC Cüzdan & F&B Asgari">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Bakiye</dt>
                <dd className="text-lg text-lykia-200">{spec.wallet?.balance_try} TRY</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">F&B harcama</dt>
                <dd className="text-lg">{spec.wallet?.fnb_spend_try} TRY</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Asgari</dt>
                <dd>{spec.wallet?.fnb_min_try} TRY</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kalan gap</dt>
                <dd className={spec.wallet?.fnb_met ? 'text-emerald-300' : 'text-amber-300'}>
                  {spec.wallet?.fnb_met ? 'hedef tamam' : `${spec.wallet?.fnb_gap_try} TRY`}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">NFC: {spec.wallet?.nfc_wallet_id}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onSpend()}
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-100"
              >
                Simüle harcama (−150 TRY)
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void topUpExtremeWallet({ user_id: userId, amount: 500 }).then((r: any) => {
                    if (!(r as any).ok) throw new Error((r as any).error || 'Topup yok')
                    setSpec((r as any).user_spec)
                    ping(`Cüzdan +${(r as any).topup?.amount_try} TRY`)
                    return refresh()
                  })
                }
              >
                Cüzdan +500
              </button>
            </div>
          </PanelCard>

          <PanelCard title="MaaS · Drone / GoPro QR">
            <p className="text-sm text-slate-300">
              Media-as-a-Service: uçuştan sonra QR ile indir — DAZE-VISION gülümsetir.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950"
                onClick={() => void onMaas('gopro')}
              >
                GoPro QR
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm text-slate-100"
                onClick={() => void onMaas('drone')}
              >
                Drone QR
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void renewExtremeMaas({ user_id: userId, hours: 48 }).then((r: any) => {
                    if (!(r as any).ok) throw new Error((r as any).error || 'Renew yok')
                    setMaas((r as any).maas)
                    ping(`MaaS yenilendi · ${(r as any).maas?.kind}`)
                  })
                }
              >
                MaaS yenile
              </button>
            </div>
            {maas && (
              <div className="mt-3 rounded-lg border border-obsidian-600 bg-obsidian-950/60 p-3 text-xs text-slate-300">
                <p className="font-medium text-lykia-200">{maas.kind} · {maas.status}</p>
                <p className="mt-1 break-all">{maas.qr_url}</p>
                <p className="mt-1 text-slate-500">{maas.qr_payload}</p>
                <p className="mt-1 text-slate-500">SKT {maas.expires_at}</p>
              </div>
            )}
          </PanelCard>
        </div>
      )}
    </div>
  )
}
