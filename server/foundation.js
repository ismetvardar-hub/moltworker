/**
 * AŞAMA 883 — Foundation.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('foundation', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fou_1', program: "Alpha",
      amount: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('foundation', seed);
    return seed;
  }
  return list;
}
export function listFoundation(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFoundation(input, actor = 'system') {
  const row = {
    id: `fou_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    program: input.program !== undefined ? input.program : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('foundation', row, 300);
  appendAudit({
    actor,
    action: 'foundation.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFoundation(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('foundation', list);
  appendAudit({ actor, action: 'foundation.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function foundationSummary() {
  const list = listFoundation();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, foundation: list };
}
