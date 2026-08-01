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

export async function runAgentQueueSlaSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/sla-sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function rebalanceAgentQueue(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/rebalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function reviveDeadAgentJobs(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/revive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function archiveAgentJobs(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function bumpAgentJobPriority(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/priority-bump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function snoozeAgentJob(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function cancelAgentJob(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}

export async function wakeSnoozedAgentJobs(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/agentqueue/wake-snoozed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
