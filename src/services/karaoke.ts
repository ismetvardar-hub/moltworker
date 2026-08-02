import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchKaraoke(): Promise<any> {
  return parse(await fetch('/api/karaoke', { headers: authHeaders() }))
}
export async function createKaraoke(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/karaoke', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchKaraoke(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/karaoke/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postKaraoke(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runKaraokeSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postKaraoke('/api/karaoke/sweep', body)
}
export async function ackKaraokeFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postKaraoke('/api/karaoke/flag/ack', body)
}
export async function markKaraokeBoothOvertime(body: Record<string, unknown> = {}): Promise<any> {
  return postKaraoke('/api/karaoke/booth/overtime', body)
}
export async function endKaraokeSession(body: Record<string, unknown> = {}): Promise<any> {
  return postKaraoke('/api/karaoke/session/end', body)
}
export async function seedPrivateRoom(body: Record<string, unknown> = {}): Promise<any> {
  return postKaraoke('/api/karaoke/private-room/seed', body)
}
