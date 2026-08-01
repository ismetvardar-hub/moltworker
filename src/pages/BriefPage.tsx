import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchBrief, type DailyBrief } from '../services/brief'

export default function BriefPage() {
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setBrief(await fetchBrief())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Brief yüklenemedi')
      }
    })()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <header>
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

      {brief && (
        <>
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
