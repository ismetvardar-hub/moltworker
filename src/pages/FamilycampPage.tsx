import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/familycamp'

export default function FamilycampPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchFamilyCamp())
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
  const openProg = (data?.programs || []).find((p: any) => p.status === 'open')
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Aile & Çocuk</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Yaz okulu · kamp · emanet · kalan koltuk {data?.summary?.seats_left ?? '—'}
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
          <PanelCard title="Programlar">
            <ul className="space-y-2 text-sm">
              {(data.programs || []).map((p: any) => (
                <li key={p.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  {p.title}
                  <div className="text-xs text-slate-500">
                    {p.booked}/{p.seats} · {p.status}
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
              onClick={() =>
                void api
                  .bookFamilyProgram({ program_id: openProg?.id || 'fp_1', child_name: 'Efe', guardian: 'Baba' })
                  .then(() => {
                    ping('Program rezervasyonu')
                    return refresh()
                  })
              }
            >
              Program rezervasyon
            </button>
          </PanelCard>
          <PanelCard title="Emanet">
            <p className="text-sm text-slate-300">Şu an bakımda: {data.summary?.in_care}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api.familyCheckIn({ child_name: 'Ada', guardian: 'Anne' }).then(() => {
                    ping('Emanet check-in')
                    return refresh()
                  })
                }
              >
                Check-in
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.familyCheckOut().then(() => {
                    ping('Teslim edildi')
                    return refresh()
                  })
                }
              >
                Check-out
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/80 px-3 py-2 text-sm text-white"
                onClick={() =>
                  void api
                    .familyEmergencyNote({ child_name: 'Ada', note: 'Alerji uyarısı — fındık' })
                    .then(() => {
                      ping('Acil not → DAZE-CREW')
                      return refresh()
                    })
                }
              >
                Acil not
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api
                    .transferFamilyChild({ to_program_id: openProg?.id || 'fp_1' })
                    .then((r: any) => {
                      if (!r.ok) throw new Error(r.error || 'Transfer başarısız')
                      ping(`Transfer → ${r.transfer?.to}`)
                      return refresh()
                    })
                    .catch((e: Error) => setError(e.message))
                }
              >
                Programa transfer
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Transfer kaydı: {data.summary?.transfers ?? 0}</p>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
