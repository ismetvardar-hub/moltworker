/**
 * AŞAMA 682 — ESG Audit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('esgaudit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'esg_1', control: "Waste",
      finding: "Gap", status: 'open', at: new Date().toISOString() }];
    writeCollection('esgaudit', seed);
    return seed;
  }
  return list;
}
export function listEsgaudit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEsgaudit(input, actor = 'system') {
  const row = {
    id: `esg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    control: input.control !== undefined ? input.control : "Waste",
    finding: input.finding !== undefined ? input.finding : "Gap",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('esgaudit', row, 300);
  appendAudit({
    actor,
    action: 'esgaudit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEsgaudit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('esgaudit', list);
  appendAudit({ actor, action: 'esgaudit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function esgauditSummary() {
  const list = listEsgaudit();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    remediate: list.filter((x) => x.status === 'remediate').length,
    closed: list.filter((x) => x.status === 'closed').length, esgaudit: list };
}
