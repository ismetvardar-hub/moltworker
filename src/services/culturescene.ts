import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchCultureScene() {
  return parse(await fetch('/api/culture', { headers: authHeaders() }))
}
export async function createCultureEvent(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function runCulturesceneSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackCulturesceneFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function holdCultureTicket(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function confirmCultureTicket(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function releaseCultureHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function setCultureLive(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function startCultureStream(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/stream/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function pulseCultureStream(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/stream/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function endCultureStream(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/stream/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function setCultureStageStatus(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function cultureBoxOfficeRollup() {
  return parse(
    await fetch('/api/culture/box-office', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

export async function expireCultureHolds(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/holds/expire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function refundCultureSale(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function settleCultureEvent(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/event/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function scanCultureDoor(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/door/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function callCultureCrew(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/crew/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function ackCultureCrewCall(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/crew/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function upgradeCultureSaleVip(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/sale/vip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function transferCultureHold(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/hold/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function denyCultureDoor(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/culture/door/deny', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
