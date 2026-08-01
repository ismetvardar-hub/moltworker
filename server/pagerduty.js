/**
 * AŞAMA 370 — On-Call.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pagerduty', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'onc_1', person: "Ops",
      shift: "Night", status: 'primary', at: new Date().toISOString() }];
    writeCollection('pagerduty', seed);
    return seed;
  }
  return list;
}
export function listPagerduty(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPagerduty(input, actor = 'system') {
  const row = {
    id: `onc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Ops",
    shift: input.shift !== undefined ? input.shift : "Night",
    status: input.status || 'primary',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pagerduty', row, 300);
  appendAudit({
    actor,
    action: 'pagerduty.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePagerduty(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pagerduty', list);
  appendAudit({ actor, action: 'pagerduty.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pagerdutySummary() {
  const list = listPagerduty();
  return { total: list.length, primary: list.filter((x) => x.status === 'primary').length,
    secondary: list.filter((x) => x.status === 'secondary').length,
    off: list.filter((x) => x.status === 'off').length, pagerduty: list };
}
