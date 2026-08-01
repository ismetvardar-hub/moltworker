/**
 * AŞAMA 147 — CAPEX.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('capex', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cpx_1', project: "Sahil aydınlatma",
      amount: "80000", status: 'proposed', at: new Date().toISOString() }];
    writeCollection('capex', seed);
    return seed;
  }
  return list;
}
export function listCapex(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCapex(input, actor = 'system') {
  const row = {
    id: `cpx_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    project: input.project !== undefined ? input.project : "Sahil aydınlatma",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 80000,
    status: input.status || 'proposed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('capex', row, 300);
  appendAudit({ actor, action: 'capex.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateCapex(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('capex', list);
  appendAudit({ actor, action: 'capex.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function capexSummary() {
  const list = listCapex();
  return { total: list.length, proposed: list.filter((x) => x.status === 'proposed').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, capex: list };
}
