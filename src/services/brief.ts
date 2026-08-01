import { authHeaders } from './auth'

export type DailyBrief = {
  date: string
  generatedAt: string
  headlines: string[]
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
  const res = await fetch('/api/brief', { headers: authHeaders() })
  if (!res.ok) throw new Error('Brief alınamadı')
  return (await res.json()) as DailyBrief
}
