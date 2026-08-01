/**
 * AŞAMA 263 — Yoklama.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('attendance', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'att_1', employee: "Ali",
      statusNote: "Present", status: 'present', at: new Date().toISOString() }];
    writeCollection('attendance', seed);
    return seed;
  }
  return list;
}
export function listAttendance(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAttendance(input, actor = 'system') {
  const row = {
    id: `att_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ali",
    statusNote: input.statusNote !== undefined ? input.statusNote : "Present",
    status: input.status || 'present',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('attendance', row, 300);
  appendAudit({ actor, action: 'attendance.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateAttendance(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('attendance', list);
  appendAudit({ actor, action: 'attendance.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function attendanceSummary() {
  const list = listAttendance();
  return { total: list.length, present: list.filter((x) => x.status === 'present').length,
    late: list.filter((x) => x.status === 'late').length,
    absent: list.filter((x) => x.status === 'absent').length, attendance: list };
}
