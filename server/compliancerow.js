/**
 * AŞAMA 521 — Compliance Row.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('compliancerow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cmp_1', control: "HACCP",
      owner: "Chef", status: 'pass', at: new Date().toISOString() }];
    writeCollection('compliancerow', seed);
    return seed;
  }
  return list;
}
export function listCompliancerow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCompliancerow(input, actor = 'system') {
  const row = {
    id: `cmp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    control: input.control !== undefined ? input.control : "HACCP",
    owner: input.owner !== undefined ? input.owner : "Chef",
    status: input.status || 'pass',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('compliancerow', row, 300);
  appendAudit({
    actor,
    action: 'compliancerow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCompliancerow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('compliancerow', list);
  appendAudit({ actor, action: 'compliancerow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function compliancerowSummary() {
  const list = listCompliancerow();
  return { total: list.length, pass: list.filter((x) => x.status === 'pass').length,
    gap: list.filter((x) => x.status === 'gap').length,
    remediate: list.filter((x) => x.status === 'remediate').length, compliancerow: list };
}
