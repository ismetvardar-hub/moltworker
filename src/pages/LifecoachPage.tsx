import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/lifecoach'

export default function LifecoachPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchLifeCoach())
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Yaşam Destek Uzmanı</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Fiziksel · mental · temel + wearable webhook (Apple / Garmin / Fitbit).
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
          <PanelCard title="Bayraklar & cihazlar">
            <p className="text-sm text-amber-200">
              {data.summary?.flags} dikkat · {data.summary?.devices} cihaz · {data.summary?.webhook_events} webhook
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {(data.flags || []).map((m: any) => (
                <li key={m.id} className="rounded-lg border border-amber-500/30 px-3 py-2 text-slate-200">
                  {m.client_id} · recovery {m.recovery} · mood {m.mood} · HRV {m.hrv}
                  <span className="ml-2 text-xs text-slate-500">{m.source}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {(data.devices || []).map((d: any) => (
                <li key={d.id}>
                  {d.label} · {d.provider} · {d.status}
                  {d.last_seen ? ` · son ${new Date(d.last_seen).toLocaleTimeString('tr-TR')}` : ''}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.ingestWearable({ recovery: 45, mood: 4, hrv: 48, load: 80 }).then(() => {
                    ping('Saat verisi alındı')
                    return refresh()
                  })
                }
              >
                Simüle düşük toparlanma
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api
                    .postLifeWebhook({
                      provider: 'garmin',
                      device_id: 'dev_mira_band',
                      bodyBattery: 42,
                      hrv: { lastNightAvg: 49 },
                      sleepTimeSeconds: 6.1 * 3600,
                      activityTrainingLoad: 85,
                    })
                    .then(() => {
                      ping('Garmin webhook')
                      return refresh()
                    })
                }
              >
                Garmin webhook
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api
                    .registerLifeDevice({ provider: 'fitbit', client_id: 'lc_1', label: 'Fitbit Charge' })
                    .then(() => {
                      ping('Cihaz bağlandı')
                      return refresh()
                    })
                }
              >
                Fitbit bağla
              </button>
            </div>
          </PanelCard>
          <PanelCard title="Uzman planı">
            <p className="text-xs text-slate-400">Pillars: {(data.pillars || []).join(' · ')}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Webhook: POST /api/lifecoach/webhook · header {data.webhook?.header} ({data.webhook?.algo})
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() => void api.createLifePlan({}).then(() => ping('3 sütunlu plan yazıldı'))}
              >
                Plan oluştur
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.processLifeFlags().then((r: any) => {
                    ping(`Otomasyon ${r.actions?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                Flag → ajan/recovery
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api
                    .lifeCoachCheckIn({ client_id: 'lc_2', mood: 4, sleep_h: 5.5, note: 'Yorgunluk' })
                    .then((r: any) => {
                      ping(`Check-in recovery ${r.checkin?.recovery}`)
                      return refresh()
                    })
                }
              >
                Uzman check-in
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.lifeWeeklyDigest().then((r: any) => {
                    ping(`Digest bayrak ${r.digest?.flagged_n}`)
                    return refresh()
                  })
                }
              >
                Haftalık digest
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.scheduleLifeFollowUps({}).then((r: any) => {
                    ping(`Follow-up · ${r.created?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                Follow-up planla
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.completeLifeFollowUp({}).then((r: any) => {
                    ping(r.ok ? `FU tamam · ${r.followup?.client_name}` : r.error || 'FU yok')
                    return refresh()
                  })
                }
              >
                Follow-up tamamla
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.scoreLifePlanAdherence({}).then((r: any) => {
                    ping(`Adherence ort ${r.report?.avg_score ?? '—'}`)
                    return refresh()
                  })
                }
              >
                Adherence hesapla
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Check-in: {data.summary?.checkins ?? 0} · açık FU: {data.summary?.followups_open ?? 0} ·
              adherence: {data.summary?.adherence_avg ?? '—'}
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-obsidian-950 p-2 text-[10px] text-slate-500">
              {JSON.stringify(data.webhooks?.slice?.(0, 5) || [], null, 2)}
            </pre>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
