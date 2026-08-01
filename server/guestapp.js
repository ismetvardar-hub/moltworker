/**
 * AŞAMA 127 — Misafir App.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('guestapp', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'gap_1',
      title: "Hoş geldiniz",
      channel: "push",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('guestapp', seed);
    return seed;
  }
  return list;
}

export function listGuestapp(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createGuestapp(input, actor = 'system') {
  const row = {
    id: `gap_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Hoş geldiniz",
    channel: input.channel !== undefined ? input.channel : "push",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestapp', row, 300);
  appendAudit({
    actor,
    action: 'guestapp.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateGuestapp(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestapp', list);
  appendAudit({ actor, action: 'guestapp.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function guestappSummary() {
  const list = listGuestapp();
  return {
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    sent: list.filter((x) => x.status === 'sent').length,
    failed: list.filter((x) => x.status === 'failed').length,
    guestapp: list,
  };
}
