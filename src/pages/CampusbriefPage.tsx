import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/campusbrief'

export default function CampusbriefPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchCampusBrief())
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
  const p = data?.pulses || {}
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Holding</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">CEO Kampüs Brifi</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">{data?.headline || 'Sabah nabız · aksiyon listesi'}</p>
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
          <PanelCard title="Aksiyonlar">
            <ul className="space-y-2 text-sm">
              {(data.actions || []).length === 0 && (
                <li className="text-slate-400">Kritik aksiyon yok — orman sakin.</li>
              )}
              {(data.actions || []).map((a: any, i: number) => (
                <li key={`${a.href}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (a.href) window.location.hash = `/${a.href}`
                    }}
                    className={
                      a.level === 'alert'
                        ? 'w-full rounded-lg border border-rose-500/30 px-3 py-2 text-left text-rose-100 hover:bg-rose-500/10'
                        : a.level === 'warn'
                          ? 'w-full rounded-lg border border-amber-500/30 px-3 py-2 text-left text-amber-100 hover:bg-amber-500/10'
                          : a.level === 'ok'
                            ? 'w-full rounded-lg border border-emerald-500/30 px-3 py-2 text-left text-emerald-100 hover:bg-emerald-500/10'
                            : 'w-full rounded-lg border border-obsidian-700 px-3 py-2 text-left text-slate-200 hover:bg-obsidian-800'
                    }
                  >
                    {a.text}
                    <span className="ml-2 text-[10px] text-slate-500">→ {a.href}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
              onClick={() =>
                void api.runCampusAutomations().then((r: any) => {
                  ping(`Otomasyon ${r.actions?.length ?? 0}`)
                  return refresh()
                })
              }
            >
              Çapraz otomasyon çalıştır
            </button>
            <p className="mt-2 text-[11px] text-slate-500">{data.ethos}</p>
          </PanelCard>
          <PanelCard title="Nabız panosu">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Aktif zon</dt>
                <dd>{p.campus?.active}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Stay boş</dt>
                <dd>{p.stay?.free}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Extreme slot</dt>
                <dd>{p.extreme?.open_slots}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Life flag</dt>
                <dd>{p.life?.flags}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">ESG skor</dt>
                <dd className="text-lykia-200">{p.green?.score}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ajan kuyruk</dt>
                <dd>{p.queue?.queued}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kültür live</dt>
                <dd>{p.culture?.live}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">F&B gap</dt>
                <dd>{p.mall?.fnb_gap_total}</dd>
              </div>
            </dl>
            {data.weather && (
              <p className="mt-3 text-xs text-slate-500">
                Hava: {data.weather.condition || data.weather.label || '—'} · {data.weather.summary || ''}
              </p>
            )}
          </PanelCard>
        </div>
      )}
    </div>
  )
}
