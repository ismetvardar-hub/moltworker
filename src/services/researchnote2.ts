import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchResearchnote2(): Promise<any> {
  return parse(await fetch('/api/researchnote2', { headers: authHeaders() }))
}
export async function createResearchnote2(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/researchnote2', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchResearchnote2(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/researchnote2/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
