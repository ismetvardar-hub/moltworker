import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/brief'
import type { DailyBrief } from '../services/brief'

export default function BriefPage() {
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function refresh() {
    try {
      setBrief(await api.fetchBrief())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Brief yüklenemedi')
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Günlük Brief</h1>
        <p className="mt-1 text-sm text-slate-400">
          {brief?.date || '…'} — operasyon özeti tek bakışta.
        </p>
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

      {brief && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PanelCard title={brief.title || 'Brief ops'}>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                {(brief.summaryLines || brief.headlines).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runBriefSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
                <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.ackBriefIncidents({}).then((r: any) => { ping(`Incidents ${r.acked?.length ?? 0}`); return refresh() })}>Incidents ack</button>
                <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.restockBriefInventory({}).then((r: any) => { ping(`Restock ${r.restocked?.length ?? 0}`); return refresh() })}>Inventory restock</button>
                <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.closeBriefMaintenance({}).then((r: any) => { ping(`Maint ${r.closed?.length ?? 0}`); return refresh() })}>Maintenance close</button>
                <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackBriefFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Flag {brief.summary?.flags_open ?? 0} · olay {brief.summary?.incidents_open ?? 0} · stok {brief.summary?.low_stock ?? 0} · bakım {brief.summary?.maintenance_open ?? 0}
              </p>
            </PanelCard>
            <PanelCard title="Açık flagler">
              <ul className="space-y-2 text-sm">
                {(brief.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
                {(brief.flags || []).slice(0, 10).map((f: any) => (
                  <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                    <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                    <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackBriefFlag({ id: f.id }).then(() => { ping('Ack'); return refresh() })}>Ack</button>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>

          <PanelCard title="Manşetler">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              {brief.headlines.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </PanelCard>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PanelCard title="Rezervasyon">
              <p className="text-sm text-slate-300">
                Bugün {brief.reservations.todayCount} · bekleyen {brief.reservations.pending} · onaylı{' '}
                {brief.reservations.confirmed}
              </p>
            </PanelCard>
            <PanelCard title="Vardiya">
              <p className="text-sm text-slate-300">Bugün {brief.shifts.todayCount} vardiya</p>
            </PanelCard>
            <PanelCard title="Stok">
              <p className="text-sm text-slate-300">Düşük SKU: {brief.inventory.lowStock}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {brief.inventory.lowItems?.map((i) => (
                  <li key={i.name}>
                    {i.name} — {i.qty} {i.unit}
                  </li>
                ))}
              </ul>
            </PanelCard>
            <PanelCard title="Olaylar">
              <p className="text-sm text-slate-300">
                Açık {brief.incidents.open} · kritik {brief.incidents.critical}
              </p>
            </PanelCard>
            <PanelCard title="NPS">
              <p className="text-sm text-slate-300">
                NPS {brief.feedback.nps ?? '—'} · ort. {brief.feedback.avg ?? '—'}
              </p>
            </PanelCard>
            <PanelCard title="Bahşiş">
              <p className="text-sm text-slate-300">
                {brief.tips.balance} TRY · bugün +{brief.tips.todayIn}/−{brief.tips.todayOut}
              </p>
            </PanelCard>
            <PanelCard title="Bakım">
              <p className="text-sm text-slate-300">
                Açık {brief.maintenance.open} · kritik {brief.maintenance.critical}
              </p>
            </PanelCard>
            <PanelCard title="Checklist">
              <p className="text-sm text-slate-300">
                Açık run {brief.checklists.openRuns} · bugün tamam{' '}
                {brief.checklists.completedToday}
              </p>
            </PanelCard>
            <PanelCard title="Kayıp eşya">
              <p className="text-sm text-slate-300">Depoda {brief.lostFound.stored}</p>
            </PanelCard>
          </div>
        </>
      )}
    </div>
  )
}
