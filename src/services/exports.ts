import { authHeaders } from './auth'

export type ExportCatalogItem = {
  id: string
  label: string
  columns: string[]
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchExportCatalog(): Promise<{ catalog: ExportCatalogItem[] }> {
  return parse(await fetch('/api/exports', { headers: authHeaders() }))
}

export async function downloadExport(id: string): Promise<void> {
  const res = await fetch(`/api/exports/${encodeURIComponent(id)}`, { headers: authHeaders() })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const disp = res.headers.get('Content-Disposition') || ''
  const match = /filename="([^"]+)"/.exec(disp)
  const filename = match?.[1] || `${id}.csv`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
