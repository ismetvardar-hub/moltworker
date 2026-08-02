import { FormEvent, useEffect, useState } from 'react'
import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/shifts'
import { createShift, deleteShift, listShifts, updateShift, type Shift } from '../services/shifts'
import { fetchVenues, type Venue } from '../services/venues'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState({
    venueId: '',
    role: 'Personel',
    person: '',
    date: today(),
    start: '09:00',
    end: '17:00',
  })

  async function reload() {
    try {
      const [s, v] = await Promise.all([
        listShifts(),
        fetchVenues().catch(() => ({ venues: [] as Venue[] })),
      ])
      setShifts(s.shifts)
      setOverview(s)
      setVenues(v.venues || [])
      if (!form.venueId && v.venues?.[0]?.id) {
        setForm((f) => ({ ...f, venueId: v.venues[0].id }))
      }
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vardiyalar yüklenemedi')
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createShift({
        venueId: form.venueId || undefined,
        role: form.role,
        person: form.person,
        date: form.date,
        start: form.start,
        end: form.end,
      })
      setForm((f) => ({ ...f, person: '' }))
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız')
    }
  }

  async function toggleStatus(s: Shift) {
    const next = s.status === 'confirmed' ? 'scheduled' : 'confirmed'
    try {
      await updateShift(s.id, { status: next })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız')
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteShift(id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight text-stone-100">Vardiyalar</h1>
        <p className="mt-1 max-w-xl text-sm text-stone-400">
          Crew planı — mekan bazlı vardiya oluştur, onayla, sil.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={overview?.title || 'Vardiya ops'}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{(overview?.summaryLines || []).map((l: string) => (<li key={l}>{l}</li>))}</ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void api.runShiftsSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return reload() })}>Sweep</button>
            <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void api.openCoverShiftGap({}).then((r: any) => { ping(`Cover ${r.covered?.length ?? 0}`); return reload() })}>Cover gap</button>
            <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void api.closeShiftOps({}).then((r: any) => { ping(`Close ${r.closed?.length ?? 0}`); return reload() })}>Close shift</button>
            <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void api.assignShiftStaff({}).then((r: any) => { ping(`Assign ${r.assigned?.length ?? 0}`); return reload() })}>Assign staff</button>
            <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.ackShiftsFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return reload() })}>Flag ack</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Flag {overview?.summary?.flags_open ?? 0} · gaps {overview?.summary?.gaps ?? overview?.gaps ?? 0}</p>
        </PanelCard>
        <PanelCard title="Açık flagler">
          <ul className="space-y-2 text-sm">
            {(overview?.flags || []).length === 0 && <li className="text-slate-400">Açık flag yok.</li>}
            {(overview?.flags || []).slice(0, 10).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2">
                <span><span className="text-lykia-300">[{f.level}]</span> {f.text}</span>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]" onClick={() => void api.ackShiftsFlag({ id: f.id }).then(() => { ping('Ack'); return reload() })}>Ack</button>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      <form
        onSubmit={(e) => void onCreate(e)}
        className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-3"
      >
        <label className="text-xs text-stone-400">
          Mekan
          <select
            className="mt-1 w-full rounded-md border border-white/10 bg-stone-950 px-2 py-2 text-sm text-stone-100"
            value={form.venueId}
            onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || v.id}
              </option>
            ))}
            {venues.length === 0 && <option value="venue_olympos_beach">venue_olympos_beach</option>}
          </select>
        </label>
        <label className="text-xs text-stone-400">
          Rol
          <input
            className="mt-1 w-full rounded-md border border-white/10 bg-stone-950 px-2 py-2 text-sm text-stone-100"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            required
          />
        </label>
        <label className="text-xs text-stone-400">
          Personel
          <input
            className="mt-1 w-full rounded-md border border-white/10 bg-stone-950 px-2 py-2 text-sm text-stone-100"
            value={form.person}
            onChange={(e) => setForm((f) => ({ ...f, person: e.target.value }))}
            required
          />
        </label>
        <label className="text-xs text-stone-400">
          Tarih
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-white/10 bg-stone-950 px-2 py-2 text-sm text-stone-100"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </label>
        <label className="text-xs text-stone-400">
          Başlangıç
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-white/10 bg-stone-950 px-2 py-2 text-sm text-stone-100"
            value={form.start}
            onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
            required
          />
        </label>
        <label className="text-xs text-stone-400">
          Bitiş
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-white/10 bg-stone-950 px-2 py-2 text-sm text-stone-100"
            value={form.end}
            onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
            required
          />
        </label>
        <div className="md:col-span-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/90 px-3 py-2 text-sm text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Vardiya ekle
          </button>
        </div>
      </form>

      <section>
        <div className="mb-3 flex items-center gap-2 text-stone-300">
          <CalendarClock className="h-4 w-4" />
          <h2 className="text-sm font-medium">Plan ({shifts.length})</h2>
        </div>
        <ul className="space-y-2">
          {shifts.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="text-sm text-stone-200">
                <div className="font-medium">
                  {s.person} · {s.role}
                </div>
                <div className="text-xs text-stone-500">
                  {s.venueId || '—'} · {s.date} · {s.start}–{s.end}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleStatus(s)}
                  className={`rounded-md px-2 py-1 text-xs ${
                    s.status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-white/5 text-stone-300'
                  }`}
                >
                  {s.status}
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(s.id)}
                  className="rounded-md border border-white/10 p-1.5 text-stone-400 hover:text-rose-300"
                  aria-label="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
          {shifts.length === 0 && <li className="text-sm text-stone-500">Henüz vardiya yok.</li>}
        </ul>
      </section>
    </div>
  )
}

export default ShiftsPage
