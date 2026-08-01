/**
 * AŞAMA 159 — Secret Rotation.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('secretsrot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sec_1', secret: "JWT_SECRET",
      nextAt: "2026-09-01", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('secretsrot', seed);
    return seed;
  }
  return list;
}
export function listSecretsrot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSecretsrot(input, actor = 'system') {
  const row = {
    id: `sec_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    secret: input.secret !== undefined ? input.secret : "JWT_SECRET",
    nextAt: input.nextAt !== undefined ? input.nextAt : "2026-09-01",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('secretsrot', row, 300);
  appendAudit({ actor, action: 'secretsrot.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateSecretsrot(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('secretsrot', list);
  appendAudit({ actor, action: 'secretsrot.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function secretsrotSummary() {
  const list = listSecretsrot();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    done: list.filter((x) => x.status === 'done').length,
    overdue: list.filter((x) => x.status === 'overdue').length, secretsrot: list };
}
