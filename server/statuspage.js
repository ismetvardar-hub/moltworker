/**
 * AŞAMA 371 — Status Page.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('statuspage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stp_1', component: "Pass API",
      state: "operational", status: 'operational', at: new Date().toISOString() }];
    writeCollection('statuspage', seed);
    return seed;
  }
  return list;
}
export function listStatuspage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStatuspage(input, actor = 'system') {
  const row = {
    id: `stp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    component: input.component !== undefined ? input.component : "Pass API",
    state: input.state !== undefined ? input.state : "operational",
    status: input.status || 'operational',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('statuspage', row, 300);
  appendAudit({
    actor,
    action: 'statuspage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStatuspage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('statuspage', list);
  appendAudit({ actor, action: 'statuspage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function statuspageSummary() {
  const list = listStatuspage();
  return { total: list.length, operational: list.filter((x) => x.status === 'operational').length,
    degraded: list.filter((x) => x.status === 'degraded').length,
    outage: list.filter((x) => x.status === 'outage').length, statuspage: list };
}
