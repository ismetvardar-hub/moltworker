/**
 * AŞAMA 87 — Shuttle Saatleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('shuttle-runs', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'shu_1',
      route: "Beach↔Kaleiçi",
      depart: "10:00",
      status: 'scheduled',
      at: new Date().toISOString(),
    }];
    writeCollection('shuttle-runs', seed);
    return seed;
  }
  return list;
}

export function listShuttle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createShuttle(input, actor = 'system') {
  const row = {
    id: `shu_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "Beach↔Kaleiçi",
    depart: input.depart !== undefined ? input.depart : "10:00",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shuttle-runs', row, 300);
  appendAudit({
    actor,
    action: 'shuttle.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateShuttle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shuttle-runs', list);
  appendAudit({ actor, action: 'shuttle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function shuttleSummary() {
  const list = listShuttle();
  return {
    total: list.length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length,
    runs: list,
  };
}
