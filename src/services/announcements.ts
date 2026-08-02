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
  endAt?: string
  createdBy?: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

async function post<T = unknown>(path: string, body: Record<string, unknown> = {}) {
  return parse<T>(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function fetchAnnouncements(): Promise<{
  announcements: Announcement[]
  published: number
  unpublishedHighPriority?: number
  stalePublished?: number
  endingSoon?: number
  flags?: unknown[]
  summary?: Record<string, unknown>
  summaryLines?: string[]
  title?: string
}> {
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

export async function runAnnouncementsSweep(body: Record<string, unknown> = {}) {
  return post('/api/announcements/sweep', body)
}

export async function ackAnnouncementsFlag(body: Record<string, unknown> = {}) {
  return post('/api/announcements/flag/ack', body)
}

export async function publishHighPriorityAnnouncements(body: Record<string, unknown> = {}) {
  return post('/api/announcements/publish-high-priority', body)
}

export async function archiveStaleAnnouncements(body: Record<string, unknown> = {}) {
  return post('/api/announcements/stale/archive', body)
}

export async function seedEndingSoonAnnouncement(body: Record<string, unknown> = {}) {
  return post('/api/announcements/ending-soon/seed', body)
}
