import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 179 - VIP note alert ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('vipnotes', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'vip_1',
      guestName: "VIP Misafir",
      note: "Sessiz oda",
      status: 'active',
      read: true,
      at: new Date().toISOString(),
    }];
    writeCollection('vipnotes', seed);
    return seed;
  }
  return list;
}

function openVipnotesFlags() {
  const flags = readCollection('vipnotes-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addVipnotesFlag(candidate, actor = 'system') {
  const existing = readCollection('vipnotes-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('vipf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('vipnotes-flags', list.slice(0, 200));
  return flag;
}

function isUnreadAlert(row) {
  return row.unreadAlert === true || row.read === false || row.status === 'unread_alert';
}

function isAcknowledged(row) {
  return row.status === 'acknowledged' || Boolean(row.acknowledgedAt) || Boolean(row.ackBy);
}

function isArrivalBrief(row) {
  return row.arrivalBrief === true || row.type === 'arrival_brief' || row.status === 'arrival_brief';
}

export function listVipnotes(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createVipnotes(input = {}, actor = 'system') {
  const row = {
    id: rid('vip'),
    guestName: input.guestName !== undefined ? input.guestName : "VIP Misafir",
    note: input.note !== undefined ? input.note : "Sessiz oda",
    type: input.type || (input.arrivalBrief ? 'arrival_brief' : 'preference'),
    read: input.read !== undefined ? input.read !== false && input.read !== 'false' : input.status !== 'unread_alert',
    priority: input.priority || null,
    status: input.status || 'active',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vipnotes', row, 300);
  appendAudit({
    actor,
    action: 'vipnotes.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateVipnotes(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vipnotes', list);
  appendAudit({ actor, action: 'vipnotes.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function vipnotesSummary() {
  const list = listVipnotes();
  const unreadAlerts = list.filter(isUnreadAlert);
  const acknowledged = list.filter(isAcknowledged);
  const arrivalBriefs = list.filter(isArrivalBrief);
  const flags = openVipnotesFlags();
  return {
    title: 'LIKYA VIP Notes Ops',
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    acknowledged: acknowledged.length,
    archived: list.filter((x) => x.status === 'archived').length,
    unreadAlerts: unreadAlerts.length,
    arrivalBriefs: arrivalBriefs.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => x.status === 'active').length,
      acknowledged: acknowledged.length,
      archived: list.filter((x) => x.status === 'archived').length,
      unread_alerts: unreadAlerts.length,
      arrival_briefs: arrivalBriefs.length,
    },
    summaryLines: [
      `VIP notes ${list.length} note - unread alerts ${unreadAlerts.length} - acknowledged ${acknowledged.length}`,
      `Arrival briefs ${arrivalBriefs.length} - active ${list.filter((x) => x.status === 'active').length} - flags ${flags.length}`,
    ],
    vipnotes: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runVipnotesSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = vipnotesSummary();
  const created = [];
  const candidates = [];
  if (force || overview.unreadAlerts > 0) {
    candidates.push({
      key: 'vipnotes_unread_alert',
      level: overview.unreadAlerts > 0 ? 'warn' : 'info',
      text: `VIP unread alerts ${overview.unreadAlerts}`,
      domain: 'alert',
    });
  }
  if (force || overview.unreadAlerts > overview.acknowledged) {
    candidates.push({
      key: 'vipnotes_acknowledge_queue',
      level: overview.unreadAlerts > overview.acknowledged ? 'warn' : 'info',
      text: `VIP acknowledged ${overview.acknowledged}/${overview.unreadAlerts}`,
      domain: 'ack',
    });
  }
  if (force || overview.arrivalBriefs === 0) {
    candidates.push({
      key: 'vipnotes_arrival_brief_seed',
      level: 'info',
      text: `VIP arrival briefs ${overview.arrivalBriefs}`,
      domain: 'arrival',
    });
  }
  for (const candidate of candidates) {
    const flag = addVipnotesFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `vipnotes sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('vips'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('vipnotes-sweeps', sweep, 80);
  appendAudit({ actor, action: 'vipnotes.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: vipnotesSummary() };
}

export function ackVipnotesFlag(input = {}, actor = 'system') {
  const list = readCollection('vipnotes-flags', []) || [];
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
  writeCollection('vipnotes-flags', list);
  appendAudit({ actor, action: 'vipnotes.flag_ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: vipnotesSummary() };
}

export function markVipnotesUnreadAlert(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isUnreadAlert(x));
  if (idx < 0) return { ok: false, error: 'Unread alert yapilacak VIP note yok' };
  list[idx] = {
    ...list[idx],
    status: 'unread_alert',
    read: false,
    unreadAlert: true,
    priority: input.priority || list[idx].priority || 'high',
    alertReason: input.reason || input.alertReason || 'arrival_sensitive_preference',
    alertAt: input.alertAt || new Date().toISOString(),
    alertBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('vipnotes', list);
  appendAudit({ actor, action: 'vipnotes.unread_alert', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, note: list[idx], overview: vipnotesSummary() };
}

export function acknowledgeVipnote(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isUnreadAlert(x) || x.status === 'active');
  if (idx < 0) return { ok: false, error: 'Acknowledge edilecek VIP note yok' };
  list[idx] = {
    ...list[idx],
    status: 'acknowledged',
    read: true,
    unreadAlert: false,
    ackNote: input.ackNote || input.note || 'front_office_ack',
    acknowledgedAt: input.acknowledgedAt || new Date().toISOString(),
    ackBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('vipnotes', list);
  appendAudit({ actor, action: 'vipnotes.acknowledge_note', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, note: list[idx], overview: vipnotesSummary() };
}

export function seedVipArrivalBrief(input = {}, actor = 'system') {
  const note = createVipnotes(
    {
      guestName: input.guestName || 'VIP Arrival',
      note: input.note || 'Arrival brief: confirm room, amenity, and host greeting',
      type: 'arrival_brief',
      arrivalBrief: true,
      priority: input.priority || 'high',
      read: false,
      status: input.status || 'unread_alert',
    },
    actor,
  );
  updateVipnotes(note.id, {
    arrivalBrief: true,
    unreadAlert: true,
    read: false,
    arrivalAt: input.arrivalAt || new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
  }, actor);
  appendAudit({ actor, action: 'vipnotes.seed_arrival_brief', detail: note.guestName, meta: { id: note.id } });
  return {
    ok: true,
    note: { ...note, arrivalBrief: true, unreadAlert: true, read: false, arrivalAt: input.arrivalAt || new Date(Date.now() + 3 * 60 * 60_000).toISOString() },
    overview: vipnotesSummary(),
  };
}
