import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAgentQueue() {
  return parse(await fetch('/api/agentqueue', { headers: authHeaders() }))
}
export async function enqueueAgentJob(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function claimAgentJob(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function completeAgentJob(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
