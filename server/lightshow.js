/**
 * AŞAMA 437 — Işık Show.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lightshow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lts_1', cue: "Golden hour",
      rig: "Beam-A", status: 'programmed', at: new Date().toISOString() }];
    writeCollection('lightshow', seed);
    return seed;
  }
  return list;
}
export function listLightshow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLightshow(input, actor = 'system') {
  const row = {
    id: `lts_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cue: input.cue !== undefined ? input.cue : "Golden hour",
    rig: input.rig !== undefined ? input.rig : "Beam-A",
    status: input.status || 'programmed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lightshow', row, 300);
  appendAudit({
    actor,
    action: 'lightshow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLightshow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lightshow', list);
  appendAudit({ actor, action: 'lightshow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lightshowSummary() {
  const list = listLightshow();
  return { total: list.length, programmed: list.filter((x) => x.status === 'programmed').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, lightshow: list };
}
