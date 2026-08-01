/**
 * AŞAMA 444 — Haptic Cue.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hapticcue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hpt_1', device: "Band-3",
      cue: "Pulse", status: 'armed', at: new Date().toISOString() }];
    writeCollection('hapticcue', seed);
    return seed;
  }
  return list;
}
export function listHapticcue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHapticcue(input, actor = 'system') {
  const row = {
    id: `hpt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    device: input.device !== undefined ? input.device : "Band-3",
    cue: input.cue !== undefined ? input.cue : "Pulse",
    status: input.status || 'armed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hapticcue', row, 300);
  appendAudit({
    actor,
    action: 'hapticcue.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHapticcue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hapticcue', list);
  appendAudit({ actor, action: 'hapticcue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hapticcueSummary() {
  const list = listHapticcue();
  return { total: list.length, armed: list.filter((x) => x.status === 'armed').length,
    fired: list.filter((x) => x.status === 'fired').length,
    off: list.filter((x) => x.status === 'off').length, hapticcue: list };
}
