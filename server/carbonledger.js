/**
 * AŞAMA 676 — Carbon Ledger.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('carbonledger', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cbl_1', scope: "Scope2",
      tco2e: "12.4", status: 'logged', at: new Date().toISOString() }];
    writeCollection('carbonledger', seed);
    return seed;
  }
  return list;
}
export function listCarbonledger(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCarbonledger(input, actor = 'system') {
  const row = {
    id: `cbl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    scope: input.scope !== undefined ? input.scope : "Scope2",
    tco2e: input.tco2e !== undefined ? Number(input.tco2e) || 0 : 12.4,
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('carbonledger', row, 300);
  appendAudit({
    actor,
    action: 'carbonledger.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCarbonledger(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('carbonledger', list);
  appendAudit({ actor, action: 'carbonledger.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function carbonledgerSummary() {
  const list = listCarbonledger();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    verified: list.filter((x) => x.status === 'verified').length,
    offset: list.filter((x) => x.status === 'offset').length, carbonledger: list };
}
