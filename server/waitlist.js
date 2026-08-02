/**
 * AŞAMA 55 — Misafir bekleme listesi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function minutesOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 60000;
}

function ensure() {
  const list = readCollection('waitlist', null);
  if (!Array.isArray(list)) {
    writeCollection('waitlist', []);
    return [];
  }
  return list;
}

export function listWaitlist(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((w) => w.status === filter.status);
  return list.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

export function createWaitlistEntry(input, actor = 'system') {
  const entry = {
    id: `wl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: String(input.guestName || '').trim() || 'Misafir',
    partySize: Math.max(1, Number(input.partySize) || 2),
    venueId: input.venueId || 'venue_olympos_beach',
    phone: input.phone || null,
    status: 'waiting',
    note: input.note || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('waitlist', entry, 200);
  appendAudit({
    actor,
    action: 'waitlist.create',
    detail: `${entry.guestName} ×${entry.partySize}`,
    meta: { id: entry.id },
  });
  return entry;
}

export function updateWaitlist(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('waitlist', list);
  appendAudit({
    actor,
    action: 'waitlist.update',
    detail: `${list[idx].guestName} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function waitlistSummary() {
  const list = listWaitlist();
  const flags = readCollection('waitlist-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const waitingTooLong = list.filter((w) => w.status === 'waiting' && minutesOld(w.at || w.createdAt) >= 45);
  const seatedWithoutTable = list.filter((w) => w.status === 'seated' && !w.tableId && !w.table && !w.tableLabel);
  const abandoned = list.filter((w) => w.status === 'abandoned' || w.status === 'left' || w.status === 'no_show');
  return {
    title: 'LİKYA Waitlist Ops',
    waiting: list.filter((w) => w.status === 'waiting').length,
    seated: list.filter((w) => w.status === 'seated').length,
    waitingTooLong: waitingTooLong.length,
    seatedWithoutTable: seatedWithoutTable.length,
    abandoned: abandoned.length,
    total: list.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      waiting: list.filter((w) => w.status === 'waiting').length,
      seated: list.filter((w) => w.status === 'seated').length,
      waiting_too_long: waitingTooLong.length,
      seated_without_table: seatedWithoutTable.length,
      abandoned: abandoned.length,
      total: list.length,
    },
    summaryLines: [
      `Waitlist ${list.length} · waiting ${list.filter((w) => w.status === 'waiting').length} · seated ${list.filter((w) => w.status === 'seated').length}`,
      `Uzun bekleyen ${waitingTooLong.length} · masasız seated ${seatedWithoutTable.length} · abandoned ${abandoned.length}`,
    ],
  };
}

export function runWaitlistSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = waitlistSummary();
  const existing = readCollection('waitlist-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.waitingTooLong || 0) > 0) {
    candidates.push({
      key: 'waitlist_waiting_too_long',
      level: (overview.waitingTooLong || 0) > 0 ? 'warn' : 'info',
      text: `Uzun bekleyen waitlist misafiri ${overview.waitingTooLong || 0}`,
      domain: 'sla',
    });
  }
  if (force || (overview.seatedWithoutTable || 0) > 0) {
    candidates.push({
      key: 'waitlist_seated_without_table',
      level: (overview.seatedWithoutTable || 0) > 0 ? 'alert' : 'info',
      text: `Masa atanmadan seated waitlist kaydı ${overview.seatedWithoutTable || 0}`,
      domain: 'seating',
    });
  }
  if (force || (overview.abandoned || 0) > 0) {
    candidates.push({
      key: 'waitlist_abandoned',
      level: (overview.abandoned || 0) > 0 ? 'warn' : 'info',
      text: `Abandoned/left waitlist kaydı ${overview.abandoned || 0}`,
      domain: 'abandonment',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('wlf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('waitlist-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `waitlist sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('wls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('waitlist-sweeps', sweep, 80);
  appendAudit({ actor, action: 'waitlist.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: waitlistSummary() };
}

export function ackWaitlistFlag(input = {}, actor = 'system') {
  const list = readCollection('waitlist-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('waitlist-flags', list);
  appendAudit({ actor, action: 'waitlist.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: waitlistSummary() };
}

/** Mutator 1 — seat the next waiting party with table context. */
export function seatWaitlistEntry(input = {}, actor = 'system') {
  let row = null;
  if (input.id || input.entryId) row = ensure().find((w) => w.id === (input.id || input.entryId));
  if (!row) row = listWaitlist().find((w) => w.status === 'waiting') || listWaitlist()[0];
  if (!row && input.seed !== false) row = seedAgingWaitlistEntry({}, actor).entry;
  if (!row) return { ok: false, error: 'Waitlist kaydı yok' };
  const entry = updateWaitlist(
    row.id,
    {
      status: 'seated',
      tableId: input.tableId || input.table || 'tbl_ops',
      tableLabel: input.tableLabel || input.table || 'Ops Table',
      seatedAt: new Date().toISOString(),
      seatedBy: actor,
    },
    actor,
  );
  appendAudit({ actor, action: 'waitlist.seat_ops', detail: entry?.guestName || row.guestName, meta: { id: row.id } });
  return { ok: true, entry, seated: entry ? [entry.id] : [], overview: waitlistSummary() };
}

/** Mutator 2 — mark a stale waiting party as abandoned. */
export function abandonWaitlistEntry(input = {}, actor = 'system') {
  let row = null;
  if (input.id || input.entryId) row = ensure().find((w) => w.id === (input.id || input.entryId));
  if (!row) row = listWaitlist().find((w) => w.status === 'waiting' && minutesOld(w.at || w.createdAt) >= 45) || listWaitlist().find((w) => w.status === 'waiting');
  if (!row && input.seed !== false) row = seedAgingWaitlistEntry({}, actor).entry;
  if (!row) return { ok: false, error: 'Waitlist kaydı yok' };
  const entry = updateWaitlist(
    row.id,
    {
      status: 'abandoned',
      abandonedAt: new Date().toISOString(),
      abandonReason: input.reason || 'no response',
    },
    actor,
  );
  appendAudit({ actor, action: 'waitlist.abandon', detail: entry?.guestName || row.guestName, meta: { id: row.id } });
  return { ok: true, entry, abandoned: entry ? [entry.id] : [], overview: waitlistSummary() };
}

/** Mutator 3 — seed an overdue waiting entry for SLA drills. */
export function seedAgingWaitlistEntry(input = {}, actor = 'system') {
  const entry = createWaitlistEntry(
    {
      guestName: input.guestName || 'Aging Waitlist Seed',
      partySize: input.partySize || 2,
      venueId: input.venueId || 'venue_olympos_beach',
      phone: input.phone || '+905550000000',
      note: input.note || 'waitlist SLA seed',
    },
    actor,
  );
  const list = ensure();
  const idx = list.findIndex((w) => w.id === entry.id);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      at: new Date(Date.now() - (Number(input.minutes) || 75) * 60000).toISOString(),
    };
    writeCollection('waitlist', list);
  }
  appendAudit({ actor, action: 'waitlist.seed_aging', detail: entry.guestName, meta: { id: entry.id } });
  return { ok: true, entry: ensure().find((w) => w.id === entry.id) || entry, overview: waitlistSummary() };
}
