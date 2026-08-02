import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackMusicFlag,
  createMusic,
  fetchMusic,
  markMusicZoneSilence,
  patchMusic,
  runMusicSweep,
  seedSunsetMix,
  setMusicPlaylist,
} from '../services/music'

export default function MusicPage() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string | number>>({"title":"Yeni parça","artist":"Bilinmeyen"})

  async function refresh() {
    try {
      const data = await fetchMusic()
      setRows(data.requests || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }

  useEffect(() => { void refresh() }, [])

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2600)
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      
      await createMusic(payload)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Müzik İstekleri</h1>
        <p className="mt-1 text-sm text-slate-400">Playlist kuyruğu.</p>
      </header>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      <PanelCard title="Ops toolbar" subtitle="Wave 170">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runMusicSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() }).catch((e) => setError(String(e.message || e)))}>Sweep</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackMusicFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Flag ack</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void markMusicZoneSilence({ id: rows[0]?.id }).then((r: any) => { ping(r.ok ? 'Zone silence' : r.error || 'Silence yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Zone silence</button>
          <button type="button" className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100" onClick={() => void setMusicPlaylist({ id: rows[0]?.id, playlist: 'LIKYA sunset' }).then((r: any) => { ping(r.ok ? 'Playlist set' : r.error || 'Playlist yok'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Set playlist</button>
          <button type="button" className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100" onClick={() => void seedSunsetMix({ title: 'Sunset Mix' }).then(() => { ping('Sunset mix seed'); return refresh() }).catch((e) => setError(String(e.message || e)))}>Seed sunset mix</button>
        </div>
      </PanelCard>
      <PanelCard title="Yeni">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="artist" value={form.artist} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} />
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={`Liste (${rows.length})`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id || r.venueId || r.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.name || r.title || r.plate || r.guestName || r.item || r.label || r.subject || r.toPerson || r.supplierName || r.venueId}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                {r.overall != null ? <span className="ml-2 text-xs text-lykia-300">ort {r.overall}</span> : null}
                {r.open && r.close ? <span className="ml-2 text-xs text-slate-500">{r.open}–{r.close}</span> : null}
                <div className="text-xs text-slate-500">{r.note || r.body || r.message || r.artist || r.spot || r.reason || ''}</div>
              </div>
              <div className="flex gap-1">
                
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                  onClick={() => void patchMusic(r.id, { status: 'queued' }).then(() => refresh()).catch((e) => setError(String(e.message||e)))}>queued</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                  onClick={() => void patchMusic(r.id, { status: 'playing' }).then(() => refresh()).catch((e) => setError(String(e.message||e)))}>playing</button>
                <button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300"
                  onClick={() => void patchMusic(r.id, { status: 'done' }).then(() => refresh()).catch((e) => setError(String(e.message||e)))}>done</button>
                
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
