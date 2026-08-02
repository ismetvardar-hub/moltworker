import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAlertrules(): Promise<any> {
  return parse(await fetch('/api/alertrules', { headers: authHeaders() }))
}
export async function createAlertrules(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/alertrules', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patchAlertrules(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(`/api/alertrules/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
export async function runAlertrulesSweep(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alertrules/sweep', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function ackAlertrulesFlag(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alertrules/flag/ack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function enableAlertrules(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alertrules/enable', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function disableAlertrules(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alertrules/disable', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
export async function fireAlertrules(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/alertrules/fire', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) }))
}
