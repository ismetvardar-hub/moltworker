/**
 * AŞAMA 30 — CSV dışa aktarma merkezi.
 */

import { listGuests } from './guests.js';
import { listInventory } from './inventory.js';
import { listShifts } from './shifts.js';
import { listReservations } from './reservations.js';
import { listLoyaltyAccounts, listLedger } from './loyalty.js';
import { listIncidents } from './incidents.js';
import { listFeedback } from './feedback.js';
import { listPurchaseOrders, listSuppliers } from './suppliers.js';
import { listConsents } from './consent.js';
import { listAnnouncements } from './announcements.js';
import { listRecipes } from './recipes.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function esc(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => esc(c.key)).join(',');
  const lines = rows.map((row) => columns.map((c) => esc(typeof c.get === 'function' ? c.get(row) : row[c.key])).join(','));
  return [header, ...lines].join('\n') + '\n';
}

const CATALOG = {
  guests: {
    label: 'Misafirler',
    columns: [
      { key: 'id' },
      { key: 'name' },
      { key: 'phone' },
      { key: 'tier' },
      { key: 'passId' },
      { key: 'source' },
    ],
    rows: () => listGuests(),
  },
  inventory: {
    label: 'Envanter',
    columns: [
      { key: 'id' },
      { key: 'sku' },
      { key: 'name' },
      { key: 'qty' },
      { key: 'minQty' },
      { key: 'unit' },
      { key: 'venueId' },
      { key: 'low', get: (r) => (r.low ? 'yes' : 'no') },
    ],
    rows: () => listInventory(),
  },
  shifts: {
    label: 'Vardiyalar',
    columns: [
      { key: 'id' },
      { key: 'date' },
      { key: 'person' },
      { key: 'role' },
      { key: 'start' },
      { key: 'end' },
      { key: 'venueId' },
      { key: 'status' },
    ],
    rows: () => listShifts(),
  },
  reservations: {
    label: 'Rezervasyonlar',
    columns: [
      { key: 'id' },
      { key: 'date' },
      { key: 'time' },
      { key: 'guestName' },
      { key: 'partySize' },
      { key: 'venueId' },
      { key: 'status' },
      { key: 'table' },
    ],
    rows: () => listReservations(),
  },
  loyalty: {
    label: 'Sadakat hesapları',
    columns: [
      { key: 'id' },
      { key: 'guestName' },
      { key: 'phone' },
      { key: 'points' },
      { key: 'tier' },
    ],
    rows: () => listLoyaltyAccounts(),
  },
  'loyalty-ledger': {
    label: 'Sadakat defteri',
    columns: [
      { key: 'id' },
      { key: 'at' },
      { key: 'guestName' },
      { key: 'delta' },
      { key: 'points' },
      { key: 'reason' },
      { key: 'actor' },
    ],
    rows: () => listLedger(500),
  },
  incidents: {
    label: 'Olaylar',
    columns: [
      { key: 'id' },
      { key: 'source' },
      { key: 'severity' },
      { key: 'title' },
      { key: 'status' },
      { key: 'at' },
    ],
    rows: () => listIncidents(),
  },
  feedback: {
    label: 'Geri bildirim',
    columns: [
      { key: 'id' },
      { key: 'score' },
      { key: 'guestName' },
      { key: 'channel' },
      { key: 'venueId' },
      { key: 'comment' },
      { key: 'at' },
    ],
    rows: () => listFeedback(),
  },
  suppliers: {
    label: 'Tedarikçiler',
    columns: [
      { key: 'id' },
      { key: 'name' },
      { key: 'category' },
      { key: 'contact' },
      { key: 'phone' },
      { key: 'leadDays' },
      { key: 'status' },
    ],
    rows: () => listSuppliers(),
  },
  'purchase-orders': {
    label: 'Satınalma',
    columns: [
      { key: 'id' },
      { key: 'supplierName' },
      { key: 'status' },
      { key: 'createdAt' },
      { key: 'lines', get: (r) => (r.lines || []).map((l) => `${l.name}x${l.qty}`).join('; ') },
    ],
    rows: () => listPurchaseOrders(),
  },
  consents: {
    label: 'KVKK onayları',
    columns: [
      { key: 'id' },
      { key: 'subject' },
      { key: 'purpose' },
      { key: 'granted', get: (r) => (r.granted ? 'yes' : 'no') },
      { key: 'channel' },
      { key: 'at' },
    ],
    rows: () => listConsents(),
  },
  announcements: {
    label: 'Duyurular',
    columns: [
      { key: 'id' },
      { key: 'title' },
      { key: 'priority' },
      { key: 'status' },
      { key: 'audience' },
      { key: 'createdAt' },
    ],
    rows: () => listAnnouncements(),
  },
  recipes: {
    label: 'Reçeteler',
    columns: [
      { key: 'id' },
      { key: 'name' },
      { key: 'prepMinutes' },
      { key: 'venueId' },
      {
        key: 'ingredients',
        get: (r) => (r.ingredients || []).map((i) => `${i.name}x${i.qty}`).join('; '),
      },
    ],
    rows: () => listRecipes(),
  },
};

export function listExportCatalog() {
  return Object.entries(CATALOG).map(([id, c]) => ({
    id,
    label: c.label,
    columns: c.columns.map((col) => col.key),
  }));
}

export function buildExport(id) {
  const cat = CATALOG[id];
  if (!cat) return null;
  const rows = cat.rows();
  return {
    id,
    label: cat.label,
    filename: `${id}-${new Date().toISOString().slice(0, 10)}.csv`,
    contentType: 'text/csv; charset=utf-8',
    csv: toCsv(rows, cat.columns),
    rowCount: rows.length,
  };
}

function catalogCounts() {
  const counts = {};
  let totalRows = 0;
  for (const [id, c] of Object.entries(CATALOG)) {
    let n = 0;
    try {
      n = (c.rows() || []).length;
    } catch {
      n = 0;
    }
    counts[id] = n;
    totalRows += n;
  }
  return { counts, totalRows, catalogSize: Object.keys(CATALOG).length };
}

export function buildExportsHub() {
  const catalog = listExportCatalog();
  const { counts, totalRows, catalogSize } = catalogCounts();
  const runs = readCollection('exports-runs', []) || [];
  const runList = Array.isArray(runs) ? runs : [];
  const snapshots = readCollection('exports-snapshots', []) || [];
  const snapList = Array.isArray(snapshots) ? snapshots : [];
  const flags = readCollection('exports-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const emptyKeys = catalog.filter((c) => (counts[c.id] || 0) === 0).length;

  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Dışa Aktarım',
    catalog,
    counts,
    runs: runList.slice(0, 20),
    snapshots: snapList.slice(0, 10),
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      catalog_size: catalogSize,
      total_rows: totalRows,
      empty_keys: emptyKeys,
      runs: runList.length,
      snapshots: snapList.length,
    },
    summaryLines: [
      `Katalog ${catalogSize} · satır ${totalRows}`,
      `Boş set ${emptyKeys} · run ${runList.length}`,
      `Export flag ${openFlags.length} açık`,
    ],
  };
}

export function runExportsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildExportsHub();
  const existing = readCollection('exports-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.empty_keys || 0) > 0) {
    candidates.push({
      key: 'empty',
      level: 'warn',
      text: `Boş export set ${o.summary?.empty_keys || 0}`,
      domain: 'catalog',
    });
  }
  if (force || (o.summary?.runs || 0) === 0) {
    candidates.push({
      key: 'runs',
      level: 'info',
      text: `Export run yok veya seyrek (${o.summary?.runs || 0})`,
      domain: 'runs',
    });
  }
  if (force || (o.summary?.catalog_size || 0) < 5) {
    candidates.push({
      key: 'catalog',
      level: 'alert',
      text: `Katalog boyutu ${o.summary?.catalog_size || 0}`,
      domain: 'catalog',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Exports heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('exf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('exports-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `exports sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('exs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('exports-sweeps', sweep, 80);
  appendAudit({ actor, action: 'exports.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildExportsHub() };
}

export function ackExportsFlag(input = {}, actor = 'system') {
  const list = readCollection('exports-flags', []) || [];
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
  writeCollection('exports-flags', list);
  appendAudit({ actor, action: 'exports.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildExportsHub() };
}

export function runExportsSnapshot(input = {}, actor = 'system') {
  const { counts, totalRows, catalogSize } = catalogCounts();
  const snap = {
    id: rid('exsnap'),
    at: new Date().toISOString(),
    actor,
    note: String(input.note || '').slice(0, 240) || undefined,
    catalog_size: catalogSize,
    total_rows: totalRows,
    counts,
  };
  prependItem('exports-snapshots', snap, 80);
  appendAudit({ actor, action: 'exports.snapshot', detail: snap.id, meta: { id: snap.id } });
  return { ok: true, snapshot: snap, overview: buildExportsHub() };
}

export function exportAllCatalog(input = {}, actor = 'system') {
  const keys = Object.keys(CATALOG);
  const limit = Math.min(Number(input.limit) || keys.length, keys.length);
  const sample = !!input.sample;
  const created = [];
  for (const key of keys.slice(0, limit)) {
    if (input.key && key !== input.key) continue;
    if (input.id && key !== input.id) continue;
    const file = buildExport(key);
    if (!file) continue;
    let csv = file.csv;
    if (sample) {
      const lines = csv.split('\n').filter(Boolean);
      csv = lines.slice(0, Math.min(6, lines.length)).join('\n') + '\n';
    }
    const row = {
      id: rid('exr'),
      key,
      label: file.label,
      filename: file.filename,
      rowCount: sample ? Math.min(5, file.rowCount) : file.rowCount,
      sample: sample || undefined,
      csv,
      at: new Date().toISOString(),
      actor,
    };
    created.push(row);
  }
  if (!created.length && keys[0]) {
    const file = buildExport(keys[0]);
    created.push({
      id: rid('exr'),
      key: keys[0],
      label: file?.label || keys[0],
      filename: file?.filename || `${keys[0]}.csv`,
      rowCount: file?.rowCount || 0,
      csv: file?.csv || 'id\n',
      at: new Date().toISOString(),
      actor,
    });
  }
  const existing = readCollection('exports-runs', []) || [];
  const arr = Array.isArray(existing) ? existing : [];
  writeCollection('exports-runs', [...created, ...arr].slice(0, 200));
  appendAudit({ actor, action: 'exports.catalog_export', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, runs: created, overview: buildExportsHub() };
}

export function clearExportsRuns(input = {}, actor = 'system') {
  const existing = readCollection('exports-runs', []) || [];
  const arr = Array.isArray(existing) ? existing : [];
  const before = arr.length;
  if (input.id) {
    const next = arr.filter((r) => r.id !== input.id);
    writeCollection('exports-runs', next);
    appendAudit({ actor, action: 'exports.runs_clear', detail: `1`, meta: { id: input.id } });
    return { ok: true, cleared: before - next.length, overview: buildExportsHub() };
  }
  writeCollection('exports-runs', []);
  appendAudit({ actor, action: 'exports.runs_clear', detail: `${before}`, meta: { n: before } });
  return { ok: true, cleared: before, overview: buildExportsHub() };
}
