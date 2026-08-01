import { authHeaders } from './auth'

export type I18nNote = {
  id: string
  key: string
  locale: string
  source: string
  translation: string
  status: string
  module: string
  note: string
  updatedAt: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchI18n(): Promise<{
  notes: I18nNote[]
  draft: number
  approved: number
  locales: string[]
}> {
  return parse(await fetch('/api/i18n', { headers: authHeaders() }))
}

export async function upsertI18n(input: Partial<I18nNote> & { key: string; locale: string }): Promise<{
  note: I18nNote
}> {
  return parse(
    await fetch('/api/i18n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}
