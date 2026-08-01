/**
 * AŞAMA 251 — Rate Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rateplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rtp_1', plan: "BAR",
      price: "4500", status: 'active', at: new Date().toISOString() }];
    writeCollection('rateplan', seed);
    return seed;
  }
  return list;
}
export function listRateplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRateplan(input, actor = 'system') {
  const row = {
    id: `rtp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    plan: input.plan !== undefined ? input.plan : "BAR",
    price: input.price !== undefined ? Number(input.price) || 0 : 4500,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rateplan', row, 300);
  appendAudit({ actor, action: 'rateplan.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateRateplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rateplan', list);
  appendAudit({ actor, action: 'rateplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rateplanSummary() {
  const list = listRateplan();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    retired: list.filter((x) => x.status === 'retired').length, rateplan: list };
}
