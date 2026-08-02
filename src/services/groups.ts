import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchGroups(): Promise<any> {
  return parse(await fetch('/api/groups', { headers: authHeaders() }))
}
export async function createGroups(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/groups', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchGroups(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/groups/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}

async function postGroups(path: string, body: Record<string, unknown> = {}) {
  return parse(await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

export async function runGroupsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postGroups('/api/groups/sweep', body)
}
export async function ackGroupsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postGroups('/api/groups/flag/ack', body)
}
export async function markGroupsRoomingIncomplete(body: Record<string, unknown> = {}): Promise<any> {
  return postGroups('/api/groups/rooming/incomplete', body)
}
export async function confirmGroupBlock(body: Record<string, unknown> = {}): Promise<any> {
  return postGroups('/api/groups/block/confirm', body)
}
export async function seedIncentiveGroup(body: Record<string, unknown> = {}): Promise<any> {
  return postGroups('/api/groups/incentive/seed', body)
}
