/**
 * AŞAMA 52 — Tedarikçi skor kartı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { listSuppliers } from './suppliers.js';

function ensure() {
  let list = readCollection('vendor-scores', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = listSuppliers().slice(0, 3).map((s, i) => ({
      id: `vs_${s.id}`,
      supplierId: s.id,
      supplierName: s.name,
      quality: 80 + i * 5,
      onTime: 75 + i * 4,
      priceFairness: 70 + i * 3,
      note: '',
      updatedAt: new Date().toISOString(),
    }));
    writeCollection('vendor-scores', list);
  }
  return list;
}

export function listVendorScores() {
  return ensure()
    .map((s) => ({
      ...s,
      overall: Math.round((s.quality + s.onTime + s.priceFairness) / 3),
    }))
    .sort((a, b) => b.overall - a.overall);
}

export function upsertVendorScore(input, actor = 'system') {
  const list = ensure();
  let idx = list.findIndex((s) => s.supplierId === input.supplierId || s.id === input.id);
  const row = {
    id: idx >= 0 ? list[idx].id : `vs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    supplierId: input.supplierId || list[idx]?.supplierId,
    supplierName: input.supplierName || list[idx]?.supplierName || 'Tedarikçi',
    quality: Number(input.quality ?? list[idx]?.quality ?? 70),
    onTime: Number(input.onTime ?? list[idx]?.onTime ?? 70),
    priceFairness: Number(input.priceFairness ?? list[idx]?.priceFairness ?? 70),
    note: input.note ?? list[idx]?.note ?? '',
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  if (idx >= 0) list[idx] = row;
  else list.unshift(row);
  writeCollection('vendor-scores', list);
  appendAudit({
    actor,
    action: 'vendorscore.upsert',
    detail: `${row.supplierName} → ort ${Math.round((row.quality + row.onTime + row.priceFairness) / 3)}`,
    meta: { id: row.id },
  });
  return { ...row, overall: Math.round((row.quality + row.onTime + row.priceFairness) / 3) };
}

export function vendorScoreSummary() {
  const list = listVendorScores();
  return {
    count: list.length,
    avgOverall: list.length
      ? Math.round(list.reduce((s, x) => s + x.overall, 0) / list.length)
      : null,
    top: list[0] || null,
  };
}
