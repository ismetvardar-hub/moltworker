import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchForummod(): Promise<any> {
  return parse(await fetch('/api/forummod', { headers: authHeaders() }))
}
export async function createForummod(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/forummod', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchForummod(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/forummod/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
