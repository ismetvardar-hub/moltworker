/**
 * AŞAMA 101 — Güvenlik Turu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('patrol', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ptl_1',
      zone: "Sahil",
      note: "Normal",
      status: 'ok',
      at: new Date().toISOString(),
    }];
    writeCollection('patrol', seed);
    return seed;
  }
  return list;
}

export function listPatrol(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPatrol(input, actor = 'system') {
  const row = {
    id: `ptl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Sahil",
    note: input.note !== undefined ? input.note : "Normal",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('patrol', row, 300);
  appendAudit({
    actor,
    action: 'patrol.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePatrol(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('patrol', list);
  appendAudit({ actor, action: 'patrol.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function patrolSummary() {
  const list = listPatrol();
  return {
    total: list.length,
    ok: list.filter((x) => x.status === 'ok').length,
    alert: list.filter((x) => x.status === 'alert').length,
    missed: list.filter((x) => x.status === 'missed').length,
    patrol: list,
  };
}
