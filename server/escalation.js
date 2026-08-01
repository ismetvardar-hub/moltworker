/**
 * AŞAMA 363 — Escalation.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('escalation', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'esc_1', caseId: "E-01",
      level: "2", status: 'L1', at: new Date().toISOString() }];
    writeCollection('escalation', seed);
    return seed;
  }
  return list;
}
export function listEscalation(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEscalation(input, actor = 'system') {
  const row = {
    id: `esc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    caseId: input.caseId !== undefined ? input.caseId : "E-01",
    level: input.level !== undefined ? Number(input.level) || 0 : 2,
    status: input.status || 'L1',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('escalation', row, 300);
  appendAudit({
    actor,
    action: 'escalation.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEscalation(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('escalation', list);
  appendAudit({ actor, action: 'escalation.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function escalationSummary() {
  const list = listEscalation();
  return { total: list.length, L1: list.filter((x) => x.status === 'L1').length,
    L2: list.filter((x) => x.status === 'L2').length,
    L3: list.filter((x) => x.status === 'L3').length,
    closed: list.filter((x) => x.status === 'closed').length, escalation: list };
}
