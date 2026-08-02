import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 168 - Hammam ritual slot ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('hammam', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'hmm_1',
      guestName: "Misafir",
      slot: "10:00",
      status: 'booked',
      durationMinutes: 45,
      dueAt: new Date(Date.now() + 45 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('hammam', seed);
    return seed;
  }
  return list;
}

function openHammamFlags() {
  const flags = readCollection('hammam-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addHammamFlag(candidate, actor = 'system') {
  const existing = readCollection('hammam-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('hmf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('hammam-flags', list.slice(0, 200));
  return flag;
}

function isSlotOverrun(row) {
  if (row.status === 'overrun') return true;
  if (row.status === 'done' || row.status === 'completed') return false;
  const due = Date.parse(row.dueAt || row.endsAt || row.endAt || '');
  return row.status === 'in_service' && Number.isFinite(due) && due < Date.now();
}

export function listHammam(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createHammam(input = {}, actor = 'system') {
  const row = {
    id: rid('hmm'),
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    slot: input.slot !== undefined ? input.slot : "10:00",
    therapist: input.therapist || null,
    durationMinutes: Number(input.durationMinutes ?? input.minutes ?? 45) || 45,
    dueAt: input.dueAt || input.endsAt || input.endAt || null,
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hammam', row, 300);
  appendAudit({
    actor,
    action: 'hammam.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateHammam(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.durationMinutes !== undefined) next.durationMinutes = Number(next.durationMinutes) || 0;
  list[idx] = next;
  writeCollection('hammam', list);
  appendAudit({ actor, action: 'hammam.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function hammamSummary() {
  const list = listHammam();
  const overrun = list.filter(isSlotOverrun);
  const couples = list.filter((x) => x.couplesRitual === true || x.ritual === 'couples');
  const flags = openHammamFlags();
  return {
    title: 'LIKYA Hammam Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    in_service: list.filter((x) => x.status === 'in_service').length,
    done: list.filter((x) => x.status === 'done').length,
    overrun: overrun.length,
    couples: couples.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      in_service: list.filter((x) => x.status === 'in_service').length,
      done: list.filter((x) => x.status === 'done').length,
      overrun: overrun.length,
      couples: couples.length,
    },
    summaryLines: [
      `Hammam ${list.length} slot - in service ${list.filter((x) => x.status === 'in_service').length} - overrun ${overrun.length}`,
      `Couples rituals ${couples.length} - flag ${flags.length}`,
    ],
    hammam: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runHammamSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = hammamSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overrun > 0) {
    candidates.push({
      key: 'hammam_slot_overrun',
      level: overview.overrun > 0 ? 'warn' : 'info',
      text: `Hammam slot overrun ${overview.overrun}`,
      domain: 'slot',
    });
  }
  if (force || overview.in_service > overview.done) {
    candidates.push({
      key: 'hammam_session_flow',
      level: overview.in_service > overview.done ? 'info' : 'info',
      text: `Hammam sessions in service ${overview.in_service}`,
      domain: 'session',
    });
  }
  if (force || overview.couples > 0) {
    candidates.push({
      key: 'hammam_couples_ritual',
      level: 'info',
      text: `Couples rituals ${overview.couples}`,
      domain: 'ritual',
    });
  }
  for (const candidate of candidates) {
    const flag = addHammamFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `hammam sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('hms'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('hammam-sweeps', sweep, 80);
  appendAudit({ actor, action: 'hammam.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: hammamSummary() };
}

export function ackHammamFlag(input = {}, actor = 'system') {
  const list = readCollection('hammam-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('hammam-flags', list);
  appendAudit({ actor, action: 'hammam.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: hammamSummary() };
}

export function markHammamSlotOverrun(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.slot && x.slot === input.slot));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'in_service' || x.status === 'booked');
  if (idx < 0) return { ok: false, error: 'Overrun yapilacak hammam slot yok' };
  list[idx] = {
    ...list[idx],
    status: 'overrun',
    dueAt: input.dueAt || new Date(Date.now() - 5 * 60_000).toISOString(),
    overrunAt: input.overrunAt || new Date().toISOString(),
    overrunBy: actor,
    reason: input.reason || list[idx].reason || 'Hammam slot overrun',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('hammam', list);
  appendAudit({ actor, action: 'hammam.slot_overrun', detail: list[idx].guestName || list[idx].slot, meta: { id: list[idx].id } });
  return { ok: true, hammam: list[idx], overview: hammamSummary() };
}

export function completeHammamSession(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.slot && x.slot === input.slot));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Complete edilecek hammam session yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    completedAt: input.completedAt || new Date().toISOString(),
    completedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('hammam', list);
  appendAudit({ actor, action: 'hammam.session_complete', detail: list[idx].guestName || list[idx].slot, meta: { id: list[idx].id } });
  return { ok: true, hammam: list[idx], overview: hammamSummary() };
}

export function seedCouplesRitual(input = {}, actor = 'system') {
  const hammam = createHammam(
    {
      guestName: input.guestName || 'Couples ritual',
      slot: input.slot || '17:30',
      therapist: input.therapist || 'Hammam team',
      durationMinutes: Number(input.durationMinutes ?? input.minutes ?? 75) || 75,
      dueAt: input.dueAt || new Date(Date.now() + 75 * 60_000).toISOString(),
      status: input.status || 'in_service',
    },
    actor,
  );
  updateHammam(hammam.id, { couplesRitual: true, ritual: 'couples', package: input.package || 'Sultan couples' }, actor);
  appendAudit({ actor, action: 'hammam.seed_couples_ritual', detail: hammam.guestName, meta: { id: hammam.id } });
  return {
    ok: true,
    hammam: { ...hammam, couplesRitual: true, ritual: 'couples', package: input.package || 'Sultan couples' },
    overview: hammamSummary(),
  };
}
