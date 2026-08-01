import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchDatasetcur(): Promise<any> {
  return parse(await fetch('/api/datasetcur', { headers: authHeaders() }))
}
export async function createDatasetcur(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/datasetcur', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchDatasetcur(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/datasetcur/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
