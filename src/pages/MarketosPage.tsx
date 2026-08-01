import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/marketos'

export default function MarketosPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try { setData(await api.fetchMarketOs()); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(() => { void refresh() }, [])
  function ping(m: string) { setFlash(m); window.setTimeout(() => setFlash(null), 2800) }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Pazaryeri</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Al · kirala · 2. el — deneyimden ticarete.</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {flash && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{flash}</p>}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">

          <PanelCard title="Mod özeti">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div><dt className="text-xs text-slate-500">Al</dt><dd className="text-lg text-lykia-200">{data.summary?.buy}</dd></div>
              <div><dt className="text-xs text-slate-500">Kirala</dt><dd className="text-lg">{data.summary?.rent}</dd></div>
              <div><dt className="text-xs text-slate-500">2. el</dt><dd className="text-lg">{data.summary?.used}</dd></div>
            </dl>
            <button type="button" className="mt-3 rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void api.createMarketListing({ mode:'used', title:'GoPro kılıf', price_try: 400 }).then(() => { ping('2. el ilan açıldı'); return refresh() })}>2. el ilan</button>
          </PanelCard>
          <PanelCard title="İlanlar">
            <ul className="space-y-2 text-sm">
              {(data.listings||[]).map((l: any) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
                  <span className="text-slate-200">{l.title}<span className="ml-2 text-xs text-slate-500">{l.mode} · {l.price_try} TRY</span></span>
                  {l.status==='live' && (
                    <button type="button" className="rounded-md bg-lykia-500/90 px-2 py-1 text-[10px] text-obsidian-950" onClick={() => void api.marketCheckout({ listing_id: l.id }).then(() => { ping(l.mode==='rent'?'Kiralandı':'Satın alındı'); return refresh() })}>{l.mode==='rent'?'Kirala':'Al'}</button>
                  )}
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
