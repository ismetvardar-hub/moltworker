import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchLifeCoach() {
  return parse(await fetch('/api/lifecoach', { headers: authHeaders() }))
}
export async function ingestWearable(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/wearable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function createLifePlan(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function registerLifeDevice(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
/** Demo webhook (auth’lu panelden); imza sunucuda demo_skip ile de kabul */
export async function postLifeWebhook(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(), 'X-Likya-Demo': '1' },
      body: JSON.stringify(body),
    }),
  )
}

export async function processLifeFlags() {
  return parse(
    await fetch('/api/lifecoach/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

export async function lifeCoachCheckIn(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function lifeWeeklyDigest() {
  return parse(
    await fetch('/api/lifecoach/digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}

export async function scheduleLifeFollowUps(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/followups/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function completeLifeFollowUp(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/followups/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function scoreLifePlanAdherence(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/lifecoach/adherence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
