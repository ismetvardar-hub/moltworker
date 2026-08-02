import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 169 - Private chef booking ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('privatechef', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'pch_1',
      guestName: "Misafir",
      menu: "Deniz",
      status: 'inquiry',
      menuStatus: 'pending',
      at: new Date().toISOString(),
    }];
    writeCollection('privatechef', seed);
    return seed;
  }
  return list;
}

function openPrivatechefFlags() {
  const flags = readCollection('privatechef-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPrivatechefFlag(candidate, actor = 'system') {
  const existing = readCollection('privatechef-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('pcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('privatechef-flags', list.slice(0, 200));
  return flag;
}

function isMenuPending(row) {
  return row.status === 'menu_pending' || row.menuStatus === 'pending' || row.menuPending === true;
}

export function listPrivatechef(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPrivatechef(input = {}, actor = 'system') {
  const row = {
    id: rid('pch'),
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    menu: input.menu !== undefined ? input.menu : "Deniz",
    date: input.date || input.serviceAt || null,
    pax: Number(input.pax ?? input.guests ?? 2) || 2,
    chef: input.chef || null,
    menuStatus: input.menuStatus || (input.status === 'confirmed' ? 'approved' : 'pending'),
    status: input.status || 'inquiry',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('privatechef', row, 300);
  appendAudit({
    actor,
    action: 'privatechef.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePrivatechef(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.pax !== undefined) next.pax = Number(next.pax) || 0;
  list[idx] = next;
  writeCollection('privatechef', list);
  appendAudit({ actor, action: 'privatechef.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function privatechefSummary() {
  const list = listPrivatechef();
  const menuPending = list.filter(isMenuPending);
  const confirmed = list.filter((x) => x.status === 'confirmed' || x.confirmedAt);
  const tastingMenus = list.filter((x) => x.tastingMenu === true || x.menuType === 'tasting');
  const flags = openPrivatechefFlags();
  return {
    title: 'LIKYA Private Chef Ops',
    total: list.length,
    inquiry: list.filter((x) => x.status === 'inquiry').length,
    confirmed: confirmed.length,
    served: list.filter((x) => x.status === 'served').length,
    menuPending: menuPending.length,
    tastingMenus: tastingMenus.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      inquiry: list.filter((x) => x.status === 'inquiry').length,
      confirmed: confirmed.length,
      served: list.filter((x) => x.status === 'served').length,
      menu_pending: menuPending.length,
      tasting_menus: tastingMenus.length,
    },
    summaryLines: [
      `Private chef ${list.length} booking - menu pending ${menuPending.length} - confirmed ${confirmed.length}`,
      `Tasting menus ${tastingMenus.length} - served ${list.filter((x) => x.status === 'served').length} - flag ${flags.length}`,
    ],
    privatechef: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPrivatechefSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = privatechefSummary();
  const created = [];
  const candidates = [];
  if (force || overview.menuPending > 0) {
    candidates.push({
      key: 'privatechef_menu_pending',
      level: overview.menuPending > 0 ? 'warn' : 'info',
      text: `Private chef menus pending ${overview.menuPending}`,
      domain: 'menu',
    });
  }
  if (force || overview.inquiry > overview.confirmed) {
    candidates.push({
      key: 'privatechef_booking_confirm_queue',
      level: overview.inquiry > overview.confirmed ? 'info' : 'info',
      text: `Private chef inquiries ${overview.inquiry}`,
      domain: 'booking',
    });
  }
  if (force || overview.tastingMenus > 0) {
    candidates.push({
      key: 'privatechef_tasting_menu',
      level: 'info',
      text: `Tasting menus ${overview.tastingMenus}`,
      domain: 'tasting',
    });
  }
  for (const candidate of candidates) {
    const flag = addPrivatechefFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `privatechef sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('privatechef-sweeps', sweep, 80);
  appendAudit({ actor, action: 'privatechef.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: privatechefSummary() };
}

export function ackPrivatechefFlag(input = {}, actor = 'system') {
  const list = readCollection('privatechef-flags', []) || [];
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
  writeCollection('privatechef-flags', list);
  appendAudit({ actor, action: 'privatechef.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: privatechefSummary() };
}

export function markPrivatechefMenuPending(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'inquiry' || x.status === 'confirmed');
  if (idx < 0) return { ok: false, error: 'Menu pending yapilacak private chef booking yok' };
  list[idx] = {
    ...list[idx],
    status: 'menu_pending',
    menuStatus: 'pending',
    menuPending: true,
    menuDueAt: input.menuDueAt || new Date(Date.now() + 6 * 60 * 60_000).toISOString(),
    menuPendingAt: input.menuPendingAt || new Date().toISOString(),
    menuPendingBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('privatechef', list);
  appendAudit({ actor, action: 'privatechef.menu_pending', detail: list[idx].guestName || list[idx].menu, meta: { id: list[idx].id } });
  return { ok: true, privatechef: list[idx], overview: privatechefSummary() };
}

export function confirmPrivatechefBooking(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'confirmed' && x.status !== 'served');
  if (idx < 0) return { ok: false, error: 'Confirm edilecek private chef booking yok' };
  list[idx] = {
    ...list[idx],
    status: 'confirmed',
    menuStatus: input.menuStatus || 'approved',
    menuPending: false,
    confirmedAt: input.confirmedAt || new Date().toISOString(),
    confirmedBy: actor,
    chef: input.chef || list[idx].chef || 'Private chef team',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('privatechef', list);
  appendAudit({ actor, action: 'privatechef.booking_confirm', detail: list[idx].guestName || list[idx].menu, meta: { id: list[idx].id } });
  return { ok: true, privatechef: list[idx], overview: privatechefSummary() };
}

export function seedTastingMenu(input = {}, actor = 'system') {
  const privatechef = createPrivatechef(
    {
      guestName: input.guestName || 'Tasting menu guest',
      menu: input.menu || 'Aegean tasting',
      date: input.date || input.serviceAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      pax: Number(input.pax ?? input.guests ?? 4) || 4,
      chef: input.chef || 'Executive chef',
      menuStatus: input.menuStatus || 'pending',
      status: input.status || 'inquiry',
    },
    actor,
  );
  updatePrivatechef(privatechef.id, { tastingMenu: true, menuType: 'tasting', courses: Number(input.courses ?? 7) || 7 }, actor);
  appendAudit({ actor, action: 'privatechef.seed_tasting_menu', detail: privatechef.menu, meta: { id: privatechef.id } });
  return {
    ok: true,
    privatechef: { ...privatechef, tastingMenu: true, menuType: 'tasting', courses: Number(input.courses ?? 7) || 7 },
    overview: privatechefSummary(),
  };
}
