/**
 * AŞAMA 508 — Culture Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('culturepulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clp_1', pulse: "July",
      score: "78", status: 'open', at: new Date().toISOString() }];
    writeCollection('culturepulse', seed);
    return seed;
  }
  return list;
}
export function listCulturepulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCulturepulse(input, actor = 'system') {
  const row = {
    id: `clp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pulse: input.pulse !== undefined ? input.pulse : "July",
    score: input.score !== undefined ? Number(input.score) || 0 : 78,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('culturepulse', row, 300);
  appendAudit({
    actor,
    action: 'culturepulse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCulturepulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('culturepulse', list);
  appendAudit({ actor, action: 'culturepulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function culturepulseSummary() {
  const list = listCulturepulse();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    closed: list.filter((x) => x.status === 'closed').length,
    actioned: list.filter((x) => x.status === 'actioned').length, culturepulse: list };
}
