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

export async function closeAgentBridgeChannel(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/channel/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runAgentBridgeAlertSlaSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/alert/sla-sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function routeAgentBridgeAlert(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/alert/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function muteAgentBridgeAlert(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/alert/mute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function unmuteAgentBridgeAlerts(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/alert/unmute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function snoozeAgentBridgeChannel(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/channel/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function wakeSnoozedAgentBridgeChannels(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentbridge/channel/wake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

