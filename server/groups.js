/**
 * Wave 174 - Group block ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('groups', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'grp_1',
      groupName: "Kurumsal",
      pax: "40",
      status: 'inquiry',
      roomingComplete: false,
      at: new Date().toISOString(),
    }];
    writeCollection('groups', seed);
    return seed;
  }
  return list;
}

function openGroupsFlags() {
  const flags = readCollection('groups-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addGroupsFlag(candidate, actor = 'system') {
  const existing = readCollection('groups-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('grf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('groups-flags', list.slice(0, 200));
  return flag;
}

function isRoomingIncomplete(row) {
  return row.roomingIncomplete === true || row.roomingComplete === false || row.status === 'rooming_incomplete';
}

export function listGroups(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createGroups(input = {}, actor = 'system') {
  const row = {
    id: rid('grp'),
    groupName: input.groupName !== undefined ? input.groupName : "Kurumsal",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 40,
    segment: input.segment !== undefined ? input.segment : undefined,
    incentiveGroup: input.incentiveGroup === true || input.segment === 'incentive' || undefined,
    roomsBlocked: input.roomsBlocked !== undefined ? Number(input.roomsBlocked) || 0 : undefined,
    roomingComplete: input.roomingComplete !== undefined ? Boolean(input.roomingComplete) : undefined,
    status: input.status || 'inquiry',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('groups', row, 300);
  appendAudit({
    actor,
    action: 'groups.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateGroups(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.pax !== undefined) next.pax = Number(next.pax) || 0;
  if (next.roomsBlocked !== undefined) next.roomsBlocked = Number(next.roomsBlocked) || 0;
  list[idx] = next;
  writeCollection('groups', list);
  appendAudit({ actor, action: 'groups.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function groupsSummary() {
  const list = listGroups();
  const roomingIncomplete = list.filter(isRoomingIncomplete);
  const incentiveGroups = list.filter((x) => x.segment === 'incentive' || x.incentiveGroup === true);
  const flags = openGroupsFlags();
  return {
    title: 'LIKYA Groups Ops',
    total: list.length,
    inquiry: list.filter((x) => x.status === 'inquiry').length,
    blocked: list.filter((x) => x.status === 'blocked').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    roomingIncomplete: roomingIncomplete.length,
    incentiveGroups: incentiveGroups.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      inquiry: list.filter((x) => x.status === 'inquiry').length,
      blocked: list.filter((x) => x.status === 'blocked').length,
      confirmed: list.filter((x) => x.status === 'confirmed').length,
      rooming_incomplete: roomingIncomplete.length,
      incentive_groups: incentiveGroups.length,
    },
    summaryLines: [
      `Groups ${list.length} block - rooming incomplete ${roomingIncomplete.length} - confirmed ${list.filter((x) => x.status === 'confirmed').length}`,
      `Blocked ${list.filter((x) => x.status === 'blocked').length} - incentive ${incentiveGroups.length} - flag ${flags.length}`,
    ],
    groups: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runGroupsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = groupsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.roomingIncomplete > 0) {
    candidates.push({
      key: 'groups_rooming_incomplete',
      level: overview.roomingIncomplete > 0 ? 'warn' : 'info',
      text: `Groups rooming incomplete ${overview.roomingIncomplete}`,
      domain: 'rooming',
    });
  }
  if (force || overview.blocked > 0) {
    candidates.push({
      key: 'groups_block_confirm',
      level: 'info',
      text: `Groups blocked ${overview.blocked}`,
      domain: 'block',
    });
  }
  if (force || overview.incentiveGroups === 0) {
    candidates.push({
      key: 'groups_incentive_seed',
      level: 'info',
      text: `Groups incentive rows ${overview.incentiveGroups}`,
      domain: 'incentive',
    });
  }
  for (const candidate of candidates) {
    const flag = addGroupsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `groups sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('grs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('groups-sweeps', sweep, 80);
  appendAudit({ actor, action: 'groups.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: groupsSummary() };
}

export function ackGroupsFlag(input = {}, actor = 'system') {
  const list = readCollection('groups-flags', []) || [];
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
  writeCollection('groups-flags', list);
  appendAudit({ actor, action: 'groups.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: groupsSummary() };
}

export function markGroupsRoomingIncomplete(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.groupName && x.groupName === input.groupName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isRoomingIncomplete(x));
  if (idx < 0) return { ok: false, error: 'Rooming incomplete yapilacak group yok' };
  list[idx] = {
    ...list[idx],
    status: 'rooming_incomplete',
    roomingIncomplete: true,
    roomingComplete: false,
    roomingDueAt: input.roomingDueAt || new Date().toISOString(),
    roomingNote: input.note || input.roomingNote || 'names_pending',
    roomingBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('groups', list);
  appendAudit({ actor, action: 'groups.rooming_incomplete', detail: list[idx].groupName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, group: list[idx], overview: groupsSummary() };
}

export function confirmGroupBlock(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.groupName && x.groupName === input.groupName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'blocked' || isRoomingIncomplete(x));
  if (idx < 0) return { ok: false, error: 'Confirm edilecek group block yok' };
  list[idx] = {
    ...list[idx],
    status: 'confirmed',
    roomingIncomplete: false,
    roomingComplete: true,
    blockConfirmed: true,
    confirmedAt: input.confirmedAt || new Date().toISOString(),
    confirmedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('groups', list);
  appendAudit({ actor, action: 'groups.block_confirm', detail: list[idx].groupName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, group: list[idx], overview: groupsSummary() };
}

export function seedIncentiveGroup(input = {}, actor = 'system') {
  const group = createGroups(
    {
      groupName: input.groupName || 'Wave 174 Incentive',
      pax: input.pax ?? 48,
      roomsBlocked: input.roomsBlocked ?? 24,
      segment: 'incentive',
      incentiveGroup: true,
      roomingComplete: false,
      status: input.status || 'blocked',
    },
    actor,
  );
  appendAudit({ actor, action: 'groups.seed_incentive', detail: group.groupName, meta: { id: group.id } });
  return { ok: true, group, overview: groupsSummary() };
}
