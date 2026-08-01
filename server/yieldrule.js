/**
 * AŞAMA 254 — Yield Kural.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('yieldrule', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'yld_1', name: "Weekend+",
      uplift: "15", status: 'enabled', at: new Date().toISOString() }];
    writeCollection('yieldrule', seed);
    return seed;
  }
  return list;
}
export function listYieldrule(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createYieldrule(input, actor = 'system') {
  const row = {
    id: `yld_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Weekend+",
    uplift: input.uplift !== undefined ? Number(input.uplift) || 0 : 15,
    status: input.status || 'enabled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('yieldrule', row, 300);
  appendAudit({ actor, action: 'yieldrule.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateYieldrule(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('yieldrule', list);
  appendAudit({ actor, action: 'yieldrule.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function yieldruleSummary() {
  const list = listYieldrule();
  return { total: list.length, enabled: list.filter((x) => x.status === 'enabled').length,
    disabled: list.filter((x) => x.status === 'disabled').length, yieldrule: list };
}
