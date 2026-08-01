import { CAMPUS_DOMAINS, CORE_NAV_IDS } from '../nav/campusDomains'
import PanelCard from '../components/PanelCard'

/**
 * Kampüs haritası — vizyon domain hub’ları.
 * Navigasyon hash ile; Sidebar ile aynı domain listesini kullanır.
 */
export default function CampusMapPage() {
  function go(pageId: string) {
    window.location.hash = `/${pageId}`
  }

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">
          LİKYA Kampüs Haritası
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">
          Extreme Yaşam & Deneyim Kampüsü
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Orman arazisi · spor · konaklama · açık AVM · kulüp · aile · ajan komuta. Menü sade:
          domain seç, Lab’dan eski ince modüllere in.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CAMPUS_DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => go(d.primary)}
            className="rounded-2xl border border-obsidian-700 bg-obsidian-900/80 p-4 text-left transition hover:border-lykia-500/40 hover:bg-obsidian-800/80"
          >
            <h2 className="text-base font-semibold text-lykia-200">{d.label}</h2>
            <p className="mt-1 text-xs text-slate-400">{d.description}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">
              Giriş → {d.primary}
            </p>
          </button>
        ))}
      </div>

      <PanelCard title="Hızlı çekirdek">
        <div className="flex flex-wrap gap-2">
          {CORE_NAV_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className="rounded-lg bg-obsidian-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-lykia-500/20 hover:text-lykia-200"
            >
              {id}
            </button>
          ))}
        </div>
      </PanelCard>
    </div>
  )
}
