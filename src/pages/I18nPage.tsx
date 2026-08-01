import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetchI18n, upsertI18n, type I18nNote } from '../services/i18n'

export default function I18nPage() {
  const [notes, setNotes] = useState<I18nNote[]>([])
  const [locales, setLocales] = useState<string[]>(['tr', 'en', 'de', 'ru'])
  const [stats, setStats] = useState({ draft: 0, approved: 0 })
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState('')
  const [locale, setLocale] = useState('en')
  const [source, setSource] = useState('')
  const [translation, setTranslation] = useState('')

  async function refresh() {
    try {
      const data = await fetchI18n()
      setNotes(data.notes)
      setLocales(data.locales)
      setStats({ draft: data.draft, approved: data.approved })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Çeviriler alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await upsertI18n({
        key: key.trim(),
        locale,
        source,
        translation,
        status: 'draft',
      })
      setKey('')
      setSource('')
      setTranslation('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Lokalizasyon</h1>
        <p className="mt-1 text-sm text-slate-400">
          BABEL not defteri — taslak {stats.draft} · onaylı {stats.approved}
        </p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Yeni çeviri">
        <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <select
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="Kaynak (TR)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <input
            className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100"
            placeholder="Çeviri"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-2 md:w-fit"
          >
            Kaydet
          </button>
        </form>
      </PanelCard>
      <PanelCard title={`Notlar (${notes.length})`}>
        <ul className="space-y-2 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="font-mono text-xs text-lykia-300">
                {n.key}:{n.locale} · {n.status}
              </div>
              <div className="text-slate-300">{n.source}</div>
              <div className="text-slate-400">{n.translation}</div>
              <button
                type="button"
                className="mt-1 text-xs text-emerald-300"
                onClick={() =>
                  void upsertI18n({ ...n, status: 'approved' })
                    .then(() => refresh())
                    .catch((e) => setError(e instanceof Error ? e.message : 'Hata'))
                }
              >
                onayla
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
