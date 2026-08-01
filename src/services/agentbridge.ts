import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAgentBridge() {
  return parse(await fetch('/api/agentbridge', { headers: authHeaders() }))
}

export async function agentBridgePing(body: Record<string, unknown> = {}) {
  return parse(await fetch('/api/agentbridge/ping', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)}))
}

