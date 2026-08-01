import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/culturescene'

export default function CulturescenePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchCultureScene())
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
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Kültür & Sahne</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Sahne · bilet hold · canlı yayın nabzı.</p>
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
          <PanelCard title="Özet">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Hazır sahne</dt>
                <dd className="text-lg text-lykia-200">{data.summary?.stages_ready}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Satışta</dt>
                <dd className="text-lg">{data.summary?.on_sale}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Canlı</dt>
                <dd>{data.summary?.live}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Hold bilet</dt>
                <dd>{data.summary?.tickets_held}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api
                    .createCultureEvent({ title: 'Gece DJ Set', stage_id: 'cs_amph', tickets_total: 200 })
                    .then(() => {
                      ping('Etkinlik açıldı')
                      return refresh()
                    })
                }
              >
                Etkinlik aç
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.holdCultureTicket({ event_id: data.events?.[0]?.id, qty: 2, guest: 'CEO' }).then(() => {
                    ping('Bilet hold')
                    return refresh()
                  })
                }
              >
                2 bilet hold
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.confirmCultureTicket({}).then(() => {
                    ping('Hold onaylandı / satıldı')
                    return refresh()
                  })
                }
              >
                Hold onayla
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.startCultureStream({ event_id: data.events?.[0]?.id }).then((r: any) => {
                    ping(`Stream ${r.stream?.channel}`)
                    return refresh()
                  })
                }
              >
                Stream start
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.pulseCultureStream({ viewers: 48 }).then((r: any) => {
                    ping(`İzleyici ${r.stream?.viewers}`)
                    return refresh()
                  })
                }
              >
                Stream pulse
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.endCultureStream({}).then(() => {
                    ping('Stream ended')
                    return refresh()
                  })
                }
              >
                Stream end
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.setCultureStageStatus({ stage_id: 'cs_studio', status: 'ready' }).then(() => {
                    ping('Stüdyo ready')
                    return refresh()
                  })
                }
              >
                Stüdyo ready
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.cultureBoxOfficeRollup().then((r: any) => {
                    ping(`Gişe ${r.rollup?.tickets_sold} · ${r.rollup?.revenue_try} TRY`)
                    return refresh()
                  })
                }
              >
                Gişe rollup
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.expireCultureHolds({ force: true }).then((r: any) => {
                    ping(r.ok ? `Hold expire · ${r.expiry?.expired}` : r.error || 'Hold yok')
                    return refresh()
                  })
                }
              >
                Hold temizle
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.refundCultureSale({}).then((r: any) => {
                    ping(r.ok ? `İade · ${r.refund?.amount_try} TRY` : r.error || 'İade yok')
                    return refresh()
                  })
                }
              >
                Refund
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.settleCultureEvent({ event_id: data.events?.[0]?.id }).then((r: any) => {
                    ping(
                      r.ok
                        ? `Closeout · ${r.settlement?.net_try} TRY · %${r.settlement?.utilization_pct}`
                        : r.error || 'Settle yok',
                    )
                    return refresh()
                  })
                }
              >
                Event closeout
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Satılan bilet {data.summary?.tickets_sold ?? 0} · açık hold {data.summary?.open_holds ?? 0} · canlı
              stream {data.summary?.streams_live ?? 0} · peak {data.summary?.viewers_peak ?? 0} · iade{' '}
              {data.summary?.refunds_try ?? 0} TRY · settle {data.summary?.settlements ?? 0}
            </p>
          </PanelCard>
          <PanelCard title="Program">
            <ul className="space-y-2 text-sm">
              {(data.events || []).map((e: any) => (
                <li key={e.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {e.title}
                      <span className="ml-2 text-xs text-slate-500">
                        {e.artist} · {e.status}
                      </span>
                    </span>
                    {e.status !== 'live' && (
                      <button
                        type="button"
                        className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]"
                        onClick={() =>
                          void api.setCultureLive({ event_id: e.id }).then(() => {
                            ping('Canlıya alındı')
                            return refresh()
                          })
                        }
                      >
                        Live
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    hold {e.tickets_held}/{e.tickets_total || '∞'}
                    {e.stream ? ' · stream' : ''}
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
