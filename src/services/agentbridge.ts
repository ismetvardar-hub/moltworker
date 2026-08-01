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

export async function agentBridgeBroadcast(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function openAgentBridgeChannel(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function pulseAgentBridgeChannel(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/channel/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function escalateAgentBridgeAlert(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function resolveAgentBridgeAlert(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/alert/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

