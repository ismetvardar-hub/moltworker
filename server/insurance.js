/**
 * AŞAMA 143 — Sigorta.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('insurance', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ins_1', policy: "Yangın",
      renews: "2026-11-01", status: 'active', at: new Date().toISOString() }];
    writeCollection('insurance', seed);
    return seed;
  }
  return list;
}
export function listInsurance(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInsurance(input, actor = 'system') {
  const row = {
    id: `ins_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    policy: input.policy !== undefined ? input.policy : "Yangın",
    renews: input.renews !== undefined ? input.renews : "2026-11-01",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('insurance', row, 300);
  appendAudit({ actor, action: 'insurance.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateInsurance(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('insurance', list);
  appendAudit({ actor, action: 'insurance.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function insuranceSummary() {
  const list = listInsurance();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    renewing: list.filter((x) => x.status === 'renewing').length,
    lapsed: list.filter((x) => x.status === 'lapsed').length, insurance: list };
}
