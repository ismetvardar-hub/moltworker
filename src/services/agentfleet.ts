import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchAgentFleet() {
  return parse(await fetch('/api/agentfleet', { headers: authHeaders() }))
}
export async function pingFleetAgent(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function dispatchFleetDirective(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function sweepFleetPresence(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/presence-sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function acknowledgeFleetDirective(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/directive/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function startFleetShift(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/shift/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function handoffFleetShift(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/shift/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function retireFleetDirective(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/directive/retire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function parkFleetAgent(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/park', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function unparkFleetAgents(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/unpark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runFleetLoadBalance(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/load-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function closeFleetShift(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentfleet/shift/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
