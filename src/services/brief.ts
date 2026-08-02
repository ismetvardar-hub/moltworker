import { authHeaders } from './auth'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export type DailyBrief = {
  date: string
  generatedAt: string
  title?: string
  headlines: string[]
  summaryLines?: string[]
  flags?: Array<{ id: string; key?: string; level?: string; text?: string; status?: string }>
  summary?: {
    flags_open?: number
    incidents_open?: number
    incidents_critical?: number
    low_stock?: number
    maintenance_open?: number
    reservations_pending?: number
  }
  reservations: { todayCount: number; pending: number; confirmed: number }
  shifts: { todayCount: number }
  inventory: { lowStock: number; lowItems: { name: string; qty: number; unit: string }[] }
  incidents: { open: number; critical: number }
  feedback: { nps: number | null; avg: number | null }
  tips: { balance: number; todayIn: number; todayOut: number }
  maintenance: { open: number; critical: number }
  checklists: { openRuns: number; completedToday: number }
  lostFound: { stored: number }
}

export async function fetchBrief(): Promise<DailyBrief> {
  return parse(await fetch('/api/brief', { headers: authHeaders() }))
}
export async function runBriefSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/brief/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackBriefIncidents(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/brief/incidents/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function restockBriefInventory(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/brief/inventory/restock', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closeBriefMaintenance(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/brief/maintenance/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackBriefFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/brief/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
