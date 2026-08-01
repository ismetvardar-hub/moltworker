import { authHeaders } from './auth'

export type Announcement = {
  id: string
  title: string
  body: string
  audience: string
  brandId: string
  priority: string
  status: string
  createdAt: string
  createdBy?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchAnnouncements(): Promise<{ announcements: Announcement[]; published: number }> {
  return parse(await fetch('/api/announcements', { headers: authHeaders() }))
}

export async function createAnnouncement(input: {
  title: string
  body: string
  audience?: string
  priority?: string
}): Promise<{ announcement: Announcement }> {
  return parse(
    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await parse(
    await fetch(`/api/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  )
}
