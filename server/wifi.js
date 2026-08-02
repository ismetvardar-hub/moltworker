/**
 * Wave 165 - WiFi vouchers and access-point ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('wifi-vouchers', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'wifi_1',
        code: 'OLYMPOS-GUEST',
        minutes: 120,
        accessPoint: 'AP-Lobby',
        status: 'available',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('wifi-vouchers', seed);
    return seed;
  }
  return list;
}

function openWifiFlags() {
  const flags = readCollection('wifi-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addWifiFlag(candidate, actor = 'system') {
  const existing = readCollection('wifi-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('wff'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('wifi-flags', list.slice(0, 200));
  return flag;
}

function isCaptivePortalIssue(row) {
  return row.status === 'issue' || row.status === 'portal_issue' || row.captivePortalIssue === true;
}

export function listWifi(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createWifi(input = {}, actor = 'system') {
  const row = {
    id: `wif_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : 'GUEST-NEW',
    guestName: input.guestName || null,
    accessPoint: input.accessPoint || input.ap || 'AP-Lobby',
    minutes: input.minutes !== undefined ? Number(input.minutes) || 0 : 60,
    resetCount: input.resetCount !== undefined ? Number(input.resetCount) || 0 : 0,
    issue: input.issue || null,
    status: input.status || 'available',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wifi-vouchers', row, 300);
  appendAudit({ actor, action: 'wifi.create', detail: String(row.code || row.guestName || row.id), meta: { id: row.id } });
  return row;
}

export function updateWifi(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  for (const key of ['minutes', 'resetCount']) {
    if (next[key] !== undefined) next[key] = Number(next[key]) || 0;
  }
  list[idx] = next;
  writeCollection('wifi-vouchers', list);
  appendAudit({ actor, action: 'wifi.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function wifiSummary() {
  const list = listWifi();
  const portalIssues = list.filter(isCaptivePortalIssue);
  const flags = openWifiFlags();
  return {
    title: 'LIKYA WiFi Ops',
    total: list.length,
    available: list.filter((x) => x.status === 'available').length,
    used: list.filter((x) => x.status === 'used').length,
    expired: list.filter((x) => x.status === 'expired').length,
    portalIssues: portalIssues.length,
    resetCount: list.reduce((sum, x) => sum + Number(x.resetCount || 0), 0),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      available: list.filter((x) => x.status === 'available').length,
      used: list.filter((x) => x.status === 'used').length,
      expired: list.filter((x) => x.status === 'expired').length,
      portal_issues: portalIssues.length,
    },
    summaryLines: [
      `WiFi ${list.length} voucher - available ${list.filter((x) => x.status === 'available').length} - portal issue ${portalIssues.length}`,
      `Expired ${list.filter((x) => x.status === 'expired').length} - reset count ${list.reduce((sum, x) => sum + Number(x.resetCount || 0), 0)} - flag ${flags.length}`,
    ],
    vouchers: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runWifiSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = wifiSummary();
  const created = [];
  const candidates = [];
  if (force || overview.portalIssues > 0) {
    candidates.push({
      key: 'wifi_captive_portal_issue',
      level: overview.portalIssues > 0 ? 'alert' : 'info',
      text: `Captive portal issues ${overview.portalIssues}`,
      domain: 'portal',
    });
  }
  if (force || overview.available < 3) {
    candidates.push({
      key: 'wifi_guest_voucher_low',
      level: overview.available < 3 ? 'warn' : 'info',
      text: `Available guest vouchers ${overview.available}`,
      domain: 'voucher',
    });
  }
  if (force || overview.expired > 0) {
    candidates.push({
      key: 'wifi_expired_vouchers',
      level: 'info',
      text: `Expired WiFi vouchers ${overview.expired}`,
      domain: 'lifecycle',
    });
  }
  for (const candidate of candidates) {
    const flag = addWifiFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `wifi sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('wfs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('wifi-sweeps', sweep, 80);
  appendAudit({ actor, action: 'wifi.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: wifiSummary() };
}

export function ackWifiFlag(input = {}, actor = 'system') {
  const list = readCollection('wifi-flags', []) || [];
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
  writeCollection('wifi-flags', list);
  appendAudit({ actor, action: 'wifi.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: wifiSummary() };
}

export function flagWifiCaptivePortalIssue(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'available' || x.status === 'used');
  if (idx < 0) return { ok: false, error: 'Portal issue icin voucher yok' };
  list[idx] = {
    ...list[idx],
    status: 'portal_issue',
    captivePortalIssue: true,
    issue: input.issue || input.reason || 'Captive portal login loop',
    accessPoint: input.accessPoint || input.ap || list[idx].accessPoint || 'AP-Lobby',
    issueAt: input.issueAt || new Date().toISOString(),
    issueBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('wifi-vouchers', list);
  appendAudit({ actor, action: 'wifi.portal_issue', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, voucher: list[idx], overview: wifiSummary() };
}

export function resetWifiAccessPoint(input = {}, actor = 'system') {
  const list = ensure();
  const ap = input.accessPoint || input.ap;
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => (ap && x.accessPoint === ap) || isCaptivePortalIssue(x));
  if (idx < 0) return { ok: false, error: 'Reset edilecek AP yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'available',
    captivePortalIssue: false,
    accessPoint: ap || list[idx].accessPoint || 'AP-Lobby',
    resetCount: Number(list[idx].resetCount || 0) + 1,
    resetAt: input.resetAt || new Date().toISOString(),
    resetBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('wifi-vouchers', list);
  appendAudit({ actor, action: 'wifi.ap_reset', detail: list[idx].accessPoint || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, voucher: list[idx], overview: wifiSummary() };
}

export function seedGuestWifiVoucher(input = {}, actor = 'system') {
  const voucher = createWifi(
    {
      code: input.code || `GUEST-${randomBytes(2).toString('hex').toUpperCase()}`,
      guestName: input.guestName || 'Guest WiFi',
      accessPoint: input.accessPoint || input.ap || 'AP-Beach',
      minutes: Number(input.minutes ?? 240),
      status: input.status || 'available',
    },
    actor,
  );
  appendAudit({ actor, action: 'wifi.seed_guest_voucher', detail: voucher.code, meta: { id: voucher.id } });
  return { ok: true, voucher, overview: wifiSummary() };
}
