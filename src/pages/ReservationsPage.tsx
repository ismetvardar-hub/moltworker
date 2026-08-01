import { FormEvent, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import PanelCard from '../components/PanelCard'
import {
  createReservation,
  deleteReservation,
  listReservations,
  updateReservation,
  type Reservation,
} from '../services/reservations'
import { fetchVenues, type Venue } from '../services/venues'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [stats, setStats] = useState({ todayCount: 0, pending: 0, confirmed: 0 })
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    guestName: '',
    phone: '',
    partySize: 2,
    date: today(),
    time: '19:30',
    venueId: '',
    table: '',
    note: '',
  })

  async function refresh() {
    try {
      const [data, v] = await Promise.all([
        listReservations(),
        fetchVenues().catch(() => ({ venues: [] as Venue[] })),
      ])
      setRows(data.reservations)
      setStats({
        todayCount: data.todayCount,
        pending: data.pending,
        confirmed: data.confirmed,
      })
      setVenues(v.venues || [])
      if (!form.venueId && v.venues?.[0]?.id) {
        setForm((f) => ({ ...f, venueId: v.venues[0].id }))
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rezervasyonlar yüklenemedi')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createReservation({
        guestName: form.guestName.trim(),
        phone: form.phone.trim() || null,
        partySize: form.partySize,
        date: form.date,
        time: form.time,
        venueId: form.venueId,
        table: form.table || null,
        note: form.note,
        status: 'pending',
      })
      setForm((f) => ({ ...f, guestName: '', phone: '', note: '', table: '' }))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız')
    }
  }

  async function setStatus(r: Reservation, status: string) {
    try {
      await updateReservation(r.id, { status })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız')
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteReservation(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Rezervasyonlar</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tesis masa planı — bugün {stats.todayCount} · bekleyen {stats.pending} · onaylı{' '}
          {stats.confirmed}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <PanelCard title="Yeni rezervasyon">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-slate-400">
            Misafir
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={form.guestName}
              onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Telefon
            <input
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="text-xs text-slate-400">
            Kişi
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={form.partySize}
              onChange={(e) => setForm((f) => ({ ...f, partySize: Number(e.target.value) }))}
            />
          </label>
          <label className="text-xs text-slate-400">
            Tarih
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Saat
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Tesis
            <select
              className="mt-1 w-full rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
              value={form.venueId}
              onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Masa / not
            <div className="mt-1 flex gap-2">
              <input
                placeholder="Masa"
                className="w-28 rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
                value={form.table}
                onChange={(e) => setForm((f) => ({ ...f, table: e.target.value }))}
              />
              <input
                placeholder="Not"
                className="flex-1 rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 hover:bg-lykia-400"
            >
              Kaydet
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard title={`Plan (${rows.length})`}>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-obsidian-700 bg-obsidian-950/50 px-3 py-2"
            >
              <div className="text-sm text-slate-200">
                <div className="font-medium">
                  {r.guestName} · {r.partySize} kişi
                  {r.table ? ` · ${r.table}` : ''}
                </div>
                <div className="text-xs text-slate-500">
                  {r.date} {r.time} · {r.venueId}
                  {r.note ? ` — ${r.note}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void setStatus(r, r.status === 'confirmed' ? 'pending' : 'confirmed')}
                  className={`rounded-md px-2 py-1 text-xs ${
                    r.status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-obsidian-800 text-slate-300'
                  }`}
                >
                  {r.status}
                </button>
                <button
                  type="button"
                  onClick={() => void setStatus(r, 'seated')}
                  className="rounded-md bg-obsidian-800 px-2 py-1 text-xs text-slate-300"
                >
                  oturdu
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(r.id)}
                  className="rounded-md border border-obsidian-600 p-1.5 text-slate-400 hover:text-rose-300"
                  aria-label="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="text-sm text-slate-500">Henüz rezervasyon yok.</li>}
        </ul>
      </PanelCard>
    </div>
  )
}
