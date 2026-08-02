/**
 * AŞAMA 52 — Tedarikçi skor kartı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { listSuppliers } from './suppliers.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

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
  const flags = readCollection('vendorscore-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const low = list.filter((s) => s.overall < 75);
  const missingNote = list.filter((s) => !String(s.note || '').trim()).length;
  return {
    title: 'LİKYA Tedarikçi Skor Ops',
    count: list.length,
    avgOverall: list.length
      ? Math.round(list.reduce((s, x) => s + x.overall, 0) / list.length)
      : null,
    top: list[0] || null,
    low: low.length,
    missingNote,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      count: list.length,
      avg_overall: list.length ? Math.round(list.reduce((s, x) => s + x.overall, 0) / list.length) : null,
      low: low.length,
      missing_note: missingNote,
    },
    summaryLines: [
      `Vendor score ${list.length} · ort ${list.length ? Math.round(list.reduce((s, x) => s + x.overall, 0) / list.length) : '—'}`,
      `Düşük skor ${low.length} · not eksik ${missingNote} · flag ${openFlags.length}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

function addVendorscoreFlag(candidate, actor = 'system') {
  const existing = readCollection('vendorscore-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('vsf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('vendorscore-flags', list.slice(0, 200));
  return flag;
}

export function runVendorscoreSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const scores = listVendorScores();
  const overview = vendorScoreSummary();
  const created = [];
  const candidates = [];
  const low = scores.filter((s) => s.overall < Number(input.lowThreshold || 75));
  if (force || low.length > 0) {
    candidates.push({
      key: 'vendorscore_low_overall',
      level: low.length > 0 ? 'alert' : 'info',
      text: `Düşük vendor skor ${low.length}`,
      domain: 'quality',
    });
  }
  if (force || overview.missingNote > 0) {
    candidates.push({
      key: 'vendorscore_missing_notes',
      level: overview.missingNote > 0 ? 'warn' : 'info',
      text: `Skor notu eksik ${overview.missingNote}`,
      domain: 'review',
    });
  }
  if (force || overview.count === 0) {
    candidates.push({
      key: 'vendorscore_empty',
      level: overview.count === 0 ? 'warn' : 'info',
      text: `Vendor score kayıt ${overview.count}`,
      domain: 'coverage',
    });
  }
  for (const c of candidates) {
    const flag = addVendorscoreFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'AGORA',
        title: `vendorscore sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('vss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('vendorscore-sweeps', sweep, 80);
  appendAudit({ actor, action: 'vendorscore.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: vendorScoreSummary() };
}

export function ackVendorscoreFlag(input = {}, actor = 'system') {
  const list = readCollection('vendorscore-flags', []) || [];
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
  writeCollection('vendorscore-flags', list);
  appendAudit({ actor, action: 'vendorscore.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: vendorScoreSummary() };
}

export function reviewVendorScore(input = {}, actor = 'system') {
  const scores = listVendorScores();
  const score = scores.find((s) => s.id === input.id || s.supplierId === input.supplierId) || scores[0] || null;
  const row = upsertVendorScore(
    {
      id: score?.id,
      supplierId: input.supplierId || score?.supplierId,
      supplierName: input.supplierName || score?.supplierName || 'Ops Tedarikçi',
      quality: input.quality ?? score?.quality ?? 82,
      onTime: input.onTime ?? score?.onTime ?? 80,
      priceFairness: input.priceFairness ?? score?.priceFairness ?? 78,
      note: input.note || 'Ops review tamamlandı',
    },
    actor,
  );
  appendAudit({ actor, action: 'vendorscore.review', detail: row.supplierName, meta: { id: row.id } });
  return { ok: true, score: row, overview: vendorScoreSummary() };
}

export function flagVendorUnderperformance(input = {}, actor = 'system') {
  const suppliers = listSuppliers();
  const supplier = suppliers.find((s) => s.id === input.supplierId) || suppliers[0] || null;
  const row = upsertVendorScore(
    {
      supplierId: input.supplierId || supplier?.id || `supplier_${Date.now().toString(36)}`,
      supplierName: input.supplierName || supplier?.name || 'Ops düşük skor tedarikçi',
      quality: Number(input.quality ?? 58),
      onTime: Number(input.onTime ?? 62),
      priceFairness: Number(input.priceFairness ?? 65),
      note: input.note || 'Ops underperformance drill',
    },
    actor,
  );
  const flag = addVendorscoreFlag(
    {
      key: `vendorscore_underperform_${row.supplierId}`,
      level: 'alert',
      text: `${row.supplierName} düşük skor ${row.overall}`,
      domain: 'quality',
      scoreId: row.id,
      supplierId: row.supplierId,
    },
    actor,
  );
  appendAudit({ actor, action: 'vendorscore.flag_underperform', detail: row.supplierName, meta: { id: row.id, flagId: flag?.id } });
  return { ok: true, score: row, flag, overview: vendorScoreSummary() };
}

export function seedVendorScore(input = {}, actor = 'system') {
  const row = upsertVendorScore(
    {
      supplierId: input.supplierId || `supplier_ops_${Date.now().toString(36)}`,
      supplierName: input.supplierName || 'Ops Seed Tedarikçi',
      quality: Number(input.quality ?? 84),
      onTime: Number(input.onTime ?? 81),
      priceFairness: Number(input.priceFairness ?? 79),
      note: input.note || 'Ops seed score',
    },
    actor,
  );
  appendAudit({ actor, action: 'vendorscore.seed', detail: row.supplierName, meta: { id: row.id } });
  return { ok: true, score: row, overview: vendorScoreSummary() };
}
