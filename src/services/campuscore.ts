import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCampusCore() {
  return parse(await fetch('/api/campus', { headers: authHeaders() }))
}

export async function addCampusIncident(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function transitionCampusZone(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/zone-transition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function resolveCampusIncident(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/incident/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function campusCapacityRollup() {
  return parse(
    await fetch('/api/campus/capacity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

export async function createCampusWorkOrder(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/work-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function completeCampusWorkOrder(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/work-order/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runCampusWorkOrderSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/work-order/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function assignCampusWorkOrder(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/work-order/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function startCampusWorkOrder(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/work-order/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function escalateCampusWorkOrder(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/work-order/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function escalateCampusIncident(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/incident/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function lockdownCampusZone(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/zone/lockdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function clearCampusZoneLockdown(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/zone/lockdown/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runCampusCapacityAlertSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/campus/capacity/alert-sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
