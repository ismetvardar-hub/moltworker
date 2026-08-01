import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { authHeaders } from '../services/auth'

type OpenApiDoc = {
  openapi?: string
  info?: { title?: string; version?: string; description?: string }
  paths?: Record<string, Record<string, { summary?: string; tags?: string[] }>>
  tags?: { name: string; description?: string }[]
}

export default function DocsPage() {
  const [doc, setDoc] = useState<OpenApiDoc | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/openapi.json', { headers: authHeaders() })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setDoc((await res.json()) as OpenApiDoc)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'OpenAPI yüklenemedi')
      }
    })()
  }, [])

  const paths = Object.entries(doc?.paths ?? {})

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight text-stone-100">API Docs</h1>
        <p className="mt-1 max-w-xl text-sm text-stone-400">
          {doc?.info?.title || 'OlymposPass Platform API'} · OpenAPI {doc?.openapi || '…'}
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        <a
          href="/api/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/10 px-2 py-1 text-stone-300 hover:bg-white/5"
        >
          openapi.json
        </a>
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/10 px-2 py-1 text-stone-300 hover:bg-white/5"
        >
          /api/docs
        </a>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2 text-stone-300">
          <BookOpen className="h-4 w-4" />
          <h2 className="text-sm font-medium">Uç noktalar ({paths.length})</h2>
        </div>
        <ul className="space-y-2">
          {paths.map(([path, methods]) =>
            Object.entries(methods).map(([method, meta]) => (
              <li
                key={`${method}:${path}`}
                className="flex flex-wrap items-baseline gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs uppercase text-emerald-300">{method}</span>
                <span className="font-mono text-stone-200">{path}</span>
                <span className="text-stone-500">{meta.summary}</span>
              </li>
            )),
          )}
          {!doc && !error && <li className="text-sm text-stone-500">Yükleniyor…</li>}
        </ul>
      </section>
    </div>
  )
}
