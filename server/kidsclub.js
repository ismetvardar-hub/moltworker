/**
 * Wave 172 - Kids Club attendance ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('kids-club', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'kid_1',
      childName: 'Cocuk',
      guardian: 'Veli',
      status: 'checked_in',
      at: new Date().toISOString(),
    }];
    writeCollection('kids-club', seed);
    return seed;
  }
  return list;
}

function openKidsclubFlags() {
  const flags = readCollection('kidsclub-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addKidsclubFlag(candidate, actor = 'system') {
  const existing = readCollection('kidsclub-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('kcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('kidsclub-flags', list.slice(0, 200));
  return flag;
}

function isUncheckedChild(row) {
  return row.uncheckedChild === true || row.status === 'unchecked' || (row.status === 'scheduled' && !row.checkInAt);
}

export function listKidsclub(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createKidsclub(input = {}, actor = 'system') {
  const row = {
    id: rid('kid'),
    childName: input.childName !== undefined ? input.childName : 'Cocuk',
    guardian: input.guardian !== undefined ? input.guardian : 'Veli',
    activity: input.activity !== undefined ? input.activity : undefined,
    slot: input.slot !== undefined ? input.slot : undefined,
    status: input.status || 'checked_in',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('kids-club', row, 300);
  appendAudit({
    actor,
    action: 'kidsclub.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateKidsclub(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('kids-club', list);
  appendAudit({ actor, action: 'kidsclub.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function kidsclubSummary() {
  const list = listKidsclub();
  const uncheckedChildren = list.filter(isUncheckedChild);
  const activitySlots = list.filter((x) => x.activitySlot === true || x.slotType === 'activity');
  const flags = openKidsclubFlags();
  return {
    title: 'LIKYA Kids Club Ops',
    total: list.length,
    checked_in: list.filter((x) => x.status === 'checked_in').length,
    checked_out: list.filter((x) => x.status === 'checked_out').length,
    unchecked: uncheckedChildren.length,
    activitySlots: activitySlots.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      checked_in: list.filter((x) => x.status === 'checked_in').length,
      checked_out: list.filter((x) => x.status === 'checked_out').length,
      unchecked: uncheckedChildren.length,
      activity_slots: activitySlots.length,
    },
    summaryLines: [
      `Kids Club ${list.length} entry - unchecked ${uncheckedChildren.length} - checked in ${list.filter((x) => x.status === 'checked_in').length}`,
      `Activity slots ${activitySlots.length} - checked out ${list.filter((x) => x.status === 'checked_out').length} - flag ${flags.length}`,
    ],
    entries: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runKidsclubSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = kidsclubSummary();
  const created = [];
  const candidates = [];
  if (force || overview.unchecked > 0) {
    candidates.push({
      key: 'kidsclub_unchecked_child',
      level: overview.unchecked > 0 ? 'warn' : 'info',
      text: `Kids Club unchecked children ${overview.unchecked}`,
      domain: 'safety',
    });
  }
  if (force || overview.checked_in > 0) {
    candidates.push({
      key: 'kidsclub_checkin_flow',
      level: 'info',
      text: `Kids Club checked in ${overview.checked_in}`,
      domain: 'checkin',
    });
  }
  if (force || overview.activitySlots > 0) {
    candidates.push({
      key: 'kidsclub_activity_slot',
      level: 'info',
      text: `Kids Club activity slots ${overview.activitySlots}`,
      domain: 'activity',
    });
  }
  for (const candidate of candidates) {
    const flag = addKidsclubFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `kidsclub sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('kcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('kidsclub-sweeps', sweep, 80);
  appendAudit({ actor, action: 'kidsclub.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: kidsclubSummary() };
}

export function ackKidsclubFlag(input = {}, actor = 'system') {
  const list = readCollection('kidsclub-flags', []) || [];
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
  writeCollection('kidsclub-flags', list);
  appendAudit({ actor, action: 'kidsclub.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: kidsclubSummary() };
}

export function markKidsclubUncheckedChild(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.childName && x.childName === input.childName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'unchecked');
  if (idx < 0) return { ok: false, error: 'Unchecked yapilacak kidsclub kaydi yok' };
  list[idx] = {
    ...list[idx],
    status: 'unchecked',
    uncheckedChild: true,
    missingCheckAt: input.missingCheckAt || new Date().toISOString(),
    missingCheckBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('kids-club', list);
  appendAudit({ actor, action: 'kidsclub.unchecked_child', detail: list[idx].childName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, entry: list[idx], overview: kidsclubSummary() };
}

export function checkInKidsclubChild(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.childName && x.childName === input.childName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'checked_in');
  if (idx < 0) return { ok: false, error: 'Check-in edilecek kidsclub kaydi yok' };
  list[idx] = {
    ...list[idx],
    status: 'checked_in',
    uncheckedChild: false,
    guardianVerified: true,
    checkInAt: input.checkInAt || new Date().toISOString(),
    checkInBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('kids-club', list);
  appendAudit({ actor, action: 'kidsclub.checkin', detail: list[idx].childName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, entry: list[idx], overview: kidsclubSummary() };
}

export function seedKidsclubActivitySlot(input = {}, actor = 'system') {
  const entry = createKidsclub(
    {
      childName: input.childName || 'Activity Child',
      guardian: input.guardian || 'Activity Guardian',
      activity: input.activity || 'Mini Olympics',
      slot: input.slot || '15:00',
      status: input.status || 'scheduled',
    },
    actor,
  );
  const patched = updateKidsclub(
    entry.id,
    {
      activitySlot: true,
      slotType: 'activity',
      uncheckedChild: true,
      source: 'wave172',
    },
    actor,
  );
  appendAudit({ actor, action: 'kidsclub.seed_activity_slot', detail: patched?.activity || entry.childName, meta: { id: entry.id } });
  return { ok: true, entry: patched || entry, overview: kidsclubSummary() };
}
