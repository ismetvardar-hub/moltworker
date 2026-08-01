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
