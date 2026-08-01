/**
 * AŞAMA 213 — Sıcaklık Probe.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tempprobe', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tmp_1', station: "Grill",
      celsius: "74", status: 'ok', at: new Date().toISOString() }];
    writeCollection('tempprobe', seed);
    return seed;
  }
  return list;
}
export function listTempprobe(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTempprobe(input, actor = 'system') {
  const row = {
    id: `tmp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    station: input.station !== undefined ? input.station : "Grill",
    celsius: input.celsius !== undefined ? Number(input.celsius) || 0 : 74,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tempprobe', row, 300);
  appendAudit({ actor, action: 'tempprobe.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateTempprobe(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tempprobe', list);
  appendAudit({ actor, action: 'tempprobe.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tempprobeSummary() {
  const list = listTempprobe();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    fail: list.filter((x) => x.status === 'fail').length, tempprobe: list };
}
