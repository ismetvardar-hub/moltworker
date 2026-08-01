import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchPrism() { return parse(await fetch('/api/prism', { headers: authHeaders() })) }
export async function runPrismSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/prism/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function closePrismMark(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/prism/mark/close', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function livePrismPost(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/prism/post/live', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function runPrismDefect(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/prism/defect/run', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackPrismFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/prism/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
