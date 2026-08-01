/**
 * AŞAMA 308 — Hallucination Check.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hallucheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hlc_1', agent: "BABEL",
      sample: "Çıktı-1", status: 'clean', at: new Date().toISOString() }];
    writeCollection('hallucheck', seed);
    return seed;
  }
  return list;
}
export function listHallucheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHallucheck(input, actor = 'system') {
  const row = {
    id: `hlc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "BABEL",
    sample: input.sample !== undefined ? input.sample : "Çıktı-1",
    status: input.status || 'clean',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hallucheck', row, 300);
  appendAudit({ actor, action: 'hallucheck.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateHallucheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hallucheck', list);
  appendAudit({ actor, action: 'hallucheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hallucheckSummary() {
  const list = listHallucheck();
  return { total: list.length, clean: list.filter((x) => x.status === 'clean').length,
    flagged: list.filter((x) => x.status === 'flagged').length,
    blocked: list.filter((x) => x.status === 'blocked').length, hallucheck: list };
}
