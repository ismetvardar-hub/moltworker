import { authHeaders } from './auth'

export type ChecklistTemplate = {
  id: string
  name: string
  venueId: string
  kind: string
  items: string[]
}

export type ChecklistRun = {
  id: string
  templateId: string
  name: string
  kind: string
  venueId: string
  status: string
  checks: { id: string; label: string; done: boolean; at: string | null }[]
  startedAt: string
  completedAt: string | null
}

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data
}

export async function fetchChecklists(): Promise<{
  templates: ChecklistTemplate[]
  runs: ChecklistRun[]
  openRuns: number
}> {
  return parse(await fetch('/api/checklists', { headers: authHeaders() }))
}

export async function startChecklist(templateId: string): Promise<{ run: ChecklistRun }> {
  return parse(
    await fetch('/api/checklists/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ templateId }),
    }),
  )
}

export async function toggleCheck(
  runId: string,
  checkId: string,
  done?: boolean,
): Promise<{ run: ChecklistRun }> {
  return parse(
    await fetch(`/api/checklists/${encodeURIComponent(runId)}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ checkId, done }),
    }),
  )
}
