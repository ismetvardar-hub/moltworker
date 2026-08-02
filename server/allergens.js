/**
 * Wave 173 - Allergen labeling and guest alert ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('allergens', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'all_1',
      dish: 'Kofte menu',
      flags: 'gluten',
      status: 'labeled',
      at: new Date().toISOString(),
    }];
    writeCollection('allergens', seed);
    return seed;
  }
  return list;
}

function openAllergensFlags() {
  const flags = readCollection('allergens-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addAllergensFlag(candidate, actor = 'system') {
  const existing = readCollection('allergens-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('alf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('allergens-flags', list.slice(0, 200));
  return flag;
}

function isUnlabeledDish(row) {
  return row.unlabeledDish === true || row.status === 'unlabeled' || !String(row.flags || '').trim();
}

export function listAllergens(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createAllergens(input = {}, actor = 'system') {
  const row = {
    id: rid('all'),
    dish: input.dish !== undefined ? input.dish : 'Kofte menu',
    flags: input.flags !== undefined ? input.flags : 'gluten',
    status: input.status || 'labeled',
    guestName: input.guestName !== undefined ? input.guestName : undefined,
    severity: input.severity !== undefined ? input.severity : undefined,
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('allergens', row, 300);
  appendAudit({
    actor,
    action: 'allergens.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateAllergens(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('allergens', list);
  appendAudit({ actor, action: 'allergens.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function allergensSummary() {
  const list = listAllergens();
  const unlabeled = list.filter(isUnlabeledDish);
  const menuFlags = list.filter((x) => x.menuItemFlag === true || x.status === 'flagged');
  const guestAlerts = list.filter((x) => x.guestAlert === true || x.alertType === 'guest');
  const flags = openAllergensFlags();
  return {
    title: 'LIKYA Allergens Ops',
    total: list.length,
    labeled: list.filter((x) => x.status === 'labeled').length,
    unlabeled: unlabeled.length,
    flagged: list.filter((x) => x.status === 'flagged').length,
    guestAlerts: guestAlerts.length,
    menuFlags: menuFlags.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      labeled: list.filter((x) => x.status === 'labeled').length,
      unlabeled: unlabeled.length,
      flagged: list.filter((x) => x.status === 'flagged').length,
      guest_alerts: guestAlerts.length,
      menu_flags: menuFlags.length,
    },
    summaryLines: [
      `Allergens ${list.length} dish - unlabeled ${unlabeled.length} - flagged ${list.filter((x) => x.status === 'flagged').length}`,
      `Guest alerts ${guestAlerts.length} - menu flags ${menuFlags.length} - flag ${flags.length}`,
    ],
    rows: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runAllergensSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = allergensSummary();
  const created = [];
  const candidates = [];
  if (force || overview.unlabeled > 0) {
    candidates.push({
      key: 'allergens_unlabeled_dish',
      level: overview.unlabeled > 0 ? 'warn' : 'info',
      text: `Allergen unlabeled dishes ${overview.unlabeled}`,
      domain: 'labeling',
    });
  }
  if (force || overview.menuFlags > 0) {
    candidates.push({
      key: 'allergens_menu_item_flag',
      level: overview.menuFlags > 0 ? 'warn' : 'info',
      text: `Allergen menu item flags ${overview.menuFlags}`,
      domain: 'menu',
    });
  }
  if (force || overview.guestAlerts > 0) {
    candidates.push({
      key: 'allergens_guest_alert',
      level: 'info',
      text: `Allergen guest alerts ${overview.guestAlerts}`,
      domain: 'guest',
    });
  }
  for (const candidate of candidates) {
    const flag = addAllergensFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `allergens sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('als'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('allergens-sweeps', sweep, 80);
  appendAudit({ actor, action: 'allergens.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: allergensSummary() };
}

export function ackAllergensFlag(input = {}, actor = 'system') {
  const list = readCollection('allergens-flags', []) || [];
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
  writeCollection('allergens-flags', list);
  appendAudit({ actor, action: 'allergens.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: allergensSummary() };
}

export function markAllergensUnlabeledDish(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.dish && x.dish === input.dish));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isUnlabeledDish(x));
  if (idx < 0) return { ok: false, error: 'Unlabeled yapilacak allergen dish yok' };
  list[idx] = {
    ...list[idx],
    status: 'unlabeled',
    flags: input.flags !== undefined ? input.flags : '',
    unlabeledDish: true,
    unlabeledAt: input.unlabeledAt || new Date().toISOString(),
    unlabeledBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('allergens', list);
  appendAudit({ actor, action: 'allergens.unlabeled_dish', detail: list[idx].dish || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, row: list[idx], overview: allergensSummary() };
}

export function flagAllergensMenuItem(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.dish && x.dish === input.dish));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isUnlabeledDish);
  if (idx < 0) return { ok: false, error: 'Flag edilecek allergen menu item yok' };
  list[idx] = {
    ...list[idx],
    status: 'flagged',
    flags: input.flags || list[idx].flags || 'review',
    menuItemFlag: true,
    flagReason: input.reason || input.flagReason || 'chef_review',
    flaggedAt: input.flaggedAt || new Date().toISOString(),
    flaggedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('allergens', list);
  appendAudit({ actor, action: 'allergens.flag_menu_item', detail: list[idx].dish || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, row: list[idx], overview: allergensSummary() };
}

export function seedGuestAllergenAlert(input = {}, actor = 'system') {
  const row = createAllergens(
    {
      dish: input.dish || 'Guest alert tasting menu',
      flags: input.flags || 'nuts',
      status: input.status || 'flagged',
      guestName: input.guestName || 'Guest Alert',
      severity: input.severity || 'high',
    },
    actor,
  );
  const patched = updateAllergens(
    row.id,
    {
      guestAlert: true,
      alertType: 'guest',
      menuItemFlag: true,
      source: 'wave173',
    },
    actor,
  );
  appendAudit({ actor, action: 'allergens.seed_guest_alert', detail: patched?.guestName || row.dish, meta: { id: row.id } });
  return { ok: true, row: patched || row, overview: allergensSummary() };
}
