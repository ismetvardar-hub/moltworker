/**
 * AŞAMA 104 — Flash Rapor.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('flash', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'fls_1',
      metric: "Doluluk",
      value: "78",
      status: 'draft',
      at: new Date().toISOString(),
    }];
    writeCollection('flash', seed);
    return seed;
  }
  return list;
}

export function listFlash(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createFlash(input, actor = 'system') {
  const row = {
    id: `fls_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "Doluluk",
    value: input.value !== undefined ? Number(input.value) || 0 : 78,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('flash', row, 300);
  appendAudit({
    actor,
    action: 'flash.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFlash(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('flash', list);
  appendAudit({ actor, action: 'flash.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function flashSummary() {
  const list = listFlash();
  return {
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    flash: list,
  };
}
