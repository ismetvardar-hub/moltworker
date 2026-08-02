/**
 * Wave 174 - Guest app publish ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('guestapp', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'gap_1',
      title: "Hoş geldiniz",
      channel: "push",
      status: 'queued',
      screen: 'home',
      at: new Date().toISOString(),
    }];
    writeCollection('guestapp', seed);
    return seed;
  }
  return list;
}

function openGuestappFlags() {
  const flags = readCollection('guestapp-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addGuestappFlag(candidate, actor = 'system') {
  const existing = readCollection('guestapp-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('gaf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('guestapp-flags', list.slice(0, 200));
  return flag;
}

function isPushFailure(row) {
  return row.pushFailed === true || row.status === 'failed' || row.failureType === 'push';
}

export function listGuestapp(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createGuestapp(input = {}, actor = 'system') {
  const row = {
    id: rid('gap'),
    title: input.title !== undefined ? input.title : "Hoş geldiniz",
    channel: input.channel !== undefined ? input.channel : "push",
    screen: input.screen !== undefined ? input.screen : undefined,
    cardType: input.cardType !== undefined ? input.cardType : undefined,
    welcomeCard: input.welcomeCard === true || input.cardType === 'welcome' || undefined,
    publishVersion: input.publishVersion !== undefined ? Number(input.publishVersion) || 0 : undefined,
    status: input.status || 'queued',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestapp', row, 300);
  appendAudit({
    actor,
    action: 'guestapp.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateGuestapp(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.publishVersion !== undefined) next.publishVersion = Number(next.publishVersion) || 0;
  list[idx] = next;
  writeCollection('guestapp', list);
  appendAudit({ actor, action: 'guestapp.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function guestappSummary() {
  const list = listGuestapp();
  const pushFailures = list.filter(isPushFailure);
  const welcomeCards = list.filter((x) => x.cardType === 'welcome' || x.welcomeCard === true);
  const republished = list.filter((x) => x.republished === true);
  const flags = openGuestappFlags();
  return {
    title: 'LIKYA Guest App Ops',
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    sent: list.filter((x) => x.status === 'sent').length,
    failed: list.filter((x) => x.status === 'failed').length,
    pushFailures: pushFailures.length,
    welcomeCards: welcomeCards.length,
    republished: republished.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      queued: list.filter((x) => x.status === 'queued').length,
      sent: list.filter((x) => x.status === 'sent').length,
      failed: list.filter((x) => x.status === 'failed').length,
      push_failures: pushFailures.length,
      welcome_cards: welcomeCards.length,
      republished: republished.length,
    },
    summaryLines: [
      `Guest app ${list.length} item - push failure ${pushFailures.length} - queued ${list.filter((x) => x.status === 'queued').length}`,
      `Welcome cards ${welcomeCards.length} - republished ${republished.length} - flag ${flags.length}`,
    ],
    guestapp: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runGuestappSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = guestappSummary();
  const created = [];
  const candidates = [];
  if (force || overview.pushFailures > 0) {
    candidates.push({
      key: 'guestapp_push_failure',
      level: overview.pushFailures > 0 ? 'warn' : 'info',
      text: `Guest app push failures ${overview.pushFailures}`,
      domain: 'push',
    });
  }
  if (force || overview.queued > 0) {
    candidates.push({
      key: 'guestapp_republish_screen',
      level: 'info',
      text: `Guest app queued screens ${overview.queued}`,
      domain: 'screen',
    });
  }
  if (force || overview.welcomeCards === 0) {
    candidates.push({
      key: 'guestapp_welcome_card_seed',
      level: 'info',
      text: `Guest app welcome cards ${overview.welcomeCards}`,
      domain: 'welcome',
    });
  }
  for (const candidate of candidates) {
    const flag = addGuestappFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `guestapp sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('gas'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('guestapp-sweeps', sweep, 80);
  appendAudit({ actor, action: 'guestapp.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: guestappSummary() };
}

export function ackGuestappFlag(input = {}, actor = 'system') {
  const list = readCollection('guestapp-flags', []) || [];
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
  writeCollection('guestapp-flags', list);
  appendAudit({ actor, action: 'guestapp.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: guestappSummary() };
}

export function markGuestappPushFailure(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.title && x.title === input.title));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isPushFailure(x));
  if (idx < 0) return { ok: false, error: 'Push failure yapilacak guestapp item yok' };
  list[idx] = {
    ...list[idx],
    status: 'failed',
    pushFailed: true,
    failureType: 'push',
    failureReason: input.reason || input.failureReason || 'provider_reject',
    failedAt: input.failedAt || new Date().toISOString(),
    failedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('guestapp', list);
  appendAudit({ actor, action: 'guestapp.push_failure', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, item: list[idx], overview: guestappSummary() };
}

export function republishGuestappScreen(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.title && x.title === input.title));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'failed' || x.status === 'queued');
  if (idx < 0) return { ok: false, error: 'Republish edilecek guestapp screen yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'queued',
    screen: input.screen || list[idx].screen || 'home',
    republished: true,
    pushFailed: false,
    publishVersion: Number(list[idx].publishVersion || 0) + 1,
    republishedAt: input.republishedAt || new Date().toISOString(),
    republishedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('guestapp', list);
  appendAudit({ actor, action: 'guestapp.republish_screen', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, item: list[idx], overview: guestappSummary() };
}

export function seedWelcomeCard(input = {}, actor = 'system') {
  const card = createGuestapp(
    {
      title: input.title || 'Wave 174 Welcome Card',
      channel: input.channel || 'in_app',
      screen: input.screen || 'home',
      cardType: 'welcome',
      welcomeCard: true,
      publishVersion: 1,
      status: input.status || 'queued',
    },
    actor,
  );
  appendAudit({ actor, action: 'guestapp.seed_welcome_card', detail: card.title, meta: { id: card.id } });
  return { ok: true, card, overview: guestappSummary() };
}
