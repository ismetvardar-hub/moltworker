import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchMeetingrooms(): Promise<any> {
  return parse(await fetch('/api/meetingrooms', { headers: authHeaders() }))
}
export async function createMeetingrooms(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/meetingrooms', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchMeetingrooms(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/meetingrooms/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

export async function runMeetingroomsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/meetingrooms/sweep', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function ackMeetingroomsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/meetingrooms/flag/ack', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function markMeetingroomsBookingOverrun(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/meetingrooms/booking/overrun', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function releaseMeetingroomRoom(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/meetingrooms/room/release', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function seedBoardSetup(body: Record<string, unknown> = {}): Promise<any> {
  return parse(await fetch('/api/meetingrooms/board/seed', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}
