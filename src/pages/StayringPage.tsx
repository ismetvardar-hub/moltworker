import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/stayring'

export default function StayringPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchStayRing())
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
  const occupied = (data?.units || []).find((u: any) => u.status === 'occupied')
  const caravan = (data?.units || []).find((u: any) => u.type === 'caravan' && u.status !== 'wintering')
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Konaklama Halkası</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Glamping · karavan kışlama · bungalow · keyless · HK.
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
          <PanelCard title="Doluluk & operasyon">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Boş</dt>
                <dd className="text-lg text-emerald-300">{data.summary?.free}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Dolu</dt>
                <dd className="text-lg">{data.summary?.occupied}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kışlama</dt>
                <dd>{data.summary?.wintering}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">HK kirli</dt>
                <dd>{data.summary?.hk_dirty}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Aktif key</dt>
                <dd>{data.summary?.keys_active}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Hold</dt>
                <dd>{data.summary?.hold}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-amber-500/25 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runStayringSweep({ force: true }).then((r: any) => {
                    ping(r.ok ? `Sweep · ${r.created?.length ?? 0} flag` : r.error || 'Sweep yok')
                    return refresh()
                  })
                }
              >
                Ops sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.ackStayringFlag({ note: 'ui ack' }).then((r: any) => {
                    ping(r.ok ? `Flag ack · ${r.flag?.domain}` : r.error || 'Ack yok')
                    return refresh()
                  })
                }
              >
                Flag ack
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.createStayBooking({ nights: 2 }).then(() => {
                    ping('Rezervasyon alındı')
                    return refresh()
                  })
                }
              >
                Hızlı rezervasyon
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.issueStayKeyless({ unit_id: occupied?.id }).then(() => {
                    ping('Keyless kod')
                    return refresh()
                  })
                }
              >
                Keyless ver
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.setStayWintering({ unit_id: caravan?.id || 'su_4' }).then(() => {
                    ping('Kışlama')
                    return refresh()
                  })
                }
              >
                Karavan kışlat
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.createStayHkTask({ unit_id: occupied?.id || 'su_2', kind: 'linen' }).then(() => {
                    ping('HK görevi')
                    return refresh()
                  })
                }
              >
                HK / linen
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.checkoutStay({ unit_id: occupied?.id }).then(() => {
                    ping('Checkout')
                    return refresh()
                  })
                }
              >
                Checkout
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api
                    .completeStayHk({ unit_id: (data?.units || []).find((u: any) => u.hk === 'dirty')?.id || 'su_2' })
                    .then(() => {
                      ping('HK tamam')
                      return refresh()
                    })
                }
              >
                HK tamamla
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.stayNightRollup().then((r: any) => {
                    ping(`Doluluk %${r.rollup?.occupancy_pct} · RevPAR ${r.rollup?.revpar_try}`)
                    return refresh()
                  })
                }
              >
                Gece rollup
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api
                    .createStayGuestRequest({ unit_id: occupied?.id, kind: 'amenity', note: 'Ek yastık' })
                    .then(() => {
                      ping('Misafir istek → DAZE-CREW')
                      return refresh()
                    })
                }
              >
                Amenity istek
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.completeStayGuestRequest({}).then(() => {
                    ping('İstek tamam')
                    return refresh()
                  })
                }
              >
                İstek tamamla
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api
                    .postStayFolioCharge({
                      unit_id: occupied?.id,
                      kind: 'amenity',
                      amount_try: 250,
                      note: 'Mini bar',
                    })
                    .then((r: any) => {
                      ping(r.ok ? `Folio +${r.charge?.amount_try} TRY` : r.error || 'Folio yok')
                      return refresh()
                    })
                }
              >
                Folio yaz
              </button>
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.autoPostStayFolio({}).then((r: any) => {
                    ping(r.ok ? `Oto folio · ${r.posted?.length ?? 0}` : r.error || 'Oto folio yok')
                    return refresh()
                  })
                }
              >
                Otomatik folio
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
                onClick={() =>
                  void api.settleStayFolio({ unit_id: occupied?.id }).then((r: any) => {
                    ping(r.ok ? `Tahsil · ${r.settlement?.amount_try} TRY` : r.error || 'Açık folio yok')
                    return refresh()
                  })
                }
              >
                Folio tahsil
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/25 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runStayNightAudit({}).then((r: any) => {
                    ping(
                      r.ok
                        ? `Gece audit · %${r.audit?.occupancy_pct} · folio ${r.audit?.folio_posted}`
                        : r.error || 'Audit yok',
                    )
                    return refresh()
                  })
                }
              >
                Gece audit
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.flagStayOverstay({ force: true }).then((r: any) => {
                    ping(r.ok ? `Overstay · ${r.flagged?.length ?? 0}` : r.error || 'Overstay yok')
                    return refresh()
                  })
                }
              >
                Overstay bayrak
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.resolveStayOverstay({ mode: 'checkout' }).then((r: any) => {
                    ping(r.ok ? `Overstay çöz · ${r.overstay?.resolve_mode}` : r.error || 'Yok')
                    return refresh()
                  })
                }
              >
                Overstay çöz
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.scheduleStayLateCheckout({ unit_id: occupied?.id, hours: 2 }).then((r: any) => {
                    ping(r.ok ? `Geç çıkış · ${r.late?.hours}s` : r.error || 'Late yok')
                    return refresh()
                  })
                }
              >
                Geç çıkış
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100"
                onClick={() =>
                  void api.disputeStayFolioCharge({ unit_id: occupied?.id, reason: 'ui_dispute' }).then((r: any) => {
                    ping(r.ok ? `İtiraz · ${r.dispute?.amount_try} TRY` : r.error || 'Dispute yok')
                    return refresh()
                  })
                }
              >
                Folio itiraz
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.revokeStayKeyless({ unit_id: occupied?.id }).then((r: any) => {
                    ping(r.ok ? 'Keyless iptal' : r.error || 'Key yok')
                    return refresh()
                  })
                }
              >
                Keyless iptal
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Flag {data.summary?.flags_open ?? 0} · aging {data.summary?.aging_stays ?? 0} · HK backlog{' '}
              {data.summary?.hk_backlog ?? 0} ·{' '}
              Açık misafir istek: {data.summary?.guest_requests_open ?? 0} · Folio açık{' '}
              {data.summary?.folio_open ?? 0} · {data.summary?.folio_balance_try?.toLocaleString?.('tr-TR') ?? 0}{' '}
              TRY · overstay {data.summary?.overstays_open ?? 0} · late {data.summary?.late_checkouts ?? 0} · dispute{' '}
              {data.summary?.folio_disputes_open ?? 0}
            </p>
            {(data.summary?.occupancy_pct != null || data.summary?.revpar_try != null) && (
              <p className="mt-2 text-xs text-slate-500">
                Son gece: %{data.summary.occupancy_pct} doluluk · RevPAR {data.summary.revpar_try} TRY
              </p>
            )}
          </PanelCard>
          <PanelCard title="Üniteler">
            <ul className="space-y-2 text-sm">
              {(data.units || []).map((u: any) => (
                <li key={u.id} className="flex justify-between rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  <span>
                    {u.code} · {u.type}
                    {u.keyless ? <span className="ml-2 text-[10px] text-lykia-300">{u.keyless}</span> : null}
                  </span>
                  <span className="text-xs text-slate-400">
                    {u.status} · HK {u.hk || '—'} · {u.rate_try} TRY
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
