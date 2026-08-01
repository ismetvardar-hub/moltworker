import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}
export async function fetchBoardpack() {
  return parse(await fetch('/api/boardpack', { headers: authHeaders() }))
}
export async function runBoardpackSweep(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/boardpack/sweep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function ackBoardpackFlag(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/boardpack/flag/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function snapshotBoardpack(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/boardpack/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function renewBoardpackContract(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/boardpack/contract/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
export async function rebalanceBoardpackBudget(body: Record<string, unknown> = {}) {
  return parse(
    await fetch('/api/boardpack/budget/rebalance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    }),
  )
}
