import { authHeaders } from './auth'

export type MaintenanceTicket = {
  id: string
  title: string
  venueId: string | null
  asset: string
  priority: string
  status: string
  assignee: string
  note: string
  createdAt: string
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchMaintenance(): Promise<{
  tickets: MaintenanceTicket[]
  open: number
  critical: number
}> {
  const data = await parse<{
    tickets?: MaintenanceTicket[]
    items?: MaintenanceTicket[]
    open: number
    critical: number
  }>(await fetch('/api/maintenance', { headers: authHeaders() }))
  return {
    tickets: data.tickets || data.items || [],
    open: data.open,
    critical: data.critical,
  }
}

export async function createTicket(input: {
  title: string
  venueId?: string
  asset?: string
  priority?: string
  note?: string
}): Promise<{ ticket: MaintenanceTicket }> {
  return parse(
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    }),
  )
}

export async function updateTicket(
  id: string,
  patch: Partial<MaintenanceTicket>,
): Promise<{ ticket: MaintenanceTicket }> {
  return parse(
    await fetch(`/api/maintenance/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    }),
  )
}
