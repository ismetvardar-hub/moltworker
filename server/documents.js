/**
 * AŞAMA 51 — Belge kasası (meta + not; dosya yolu opsiyonel).
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('documents', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'doc_1',
        title: 'KVKK Aydınlatma Metni 2026.1',
        category: 'legal',
        brandId: 'brand_likya',
        version: '2026.1',
        url: '/api/docs',
        note: 'VALKYRIE onaylı',
        at: new Date().toISOString(),
      },
      {
        id: 'doc_2',
        title: 'Mutfak Hijyen Prosedürü',
        category: 'ops',
        brandId: 'brand_daze',
        version: '3.2',
        url: null,
        note: 'Açılış checklist ile bağlı',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('documents', seed);
    return seed;
  }
  return list;
}

export function listDocuments(filter = {}) {
  let list = ensure();
  if (filter.category) list = list.filter((d) => d.category === filter.category);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createDocument(input, actor = 'system') {
  const doc = {
    id: `doc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || '').trim() || 'Belge',
    category: input.category || 'general',
    brandId: input.brandId || 'brand_likya',
    version: input.version || '1.0',
    url: input.url || null,
    note: input.note || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('documents', doc, 300);
  appendAudit({
    actor,
    action: 'documents.create',
    detail: doc.title,
    meta: { id: doc.id, category: doc.category },
  });
  return doc;
}

export function removeDocument(id, actor = 'system') {
  const d = ensure().find((x) => x.id === id);
  if (!d) return null;
  deleteItem('documents', id);
  appendAudit({ actor, action: 'documents.delete', detail: d.title, meta: { id } });
  return d;
}

export function documentsSummary() {
  const list = listDocuments();
  const byCat = {};
  for (const d of list) byCat[d.category] = (byCat[d.category] || 0) + 1;
  const flags = readCollection('documents-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const missingUrl = list.filter((d) => !d.url).length;
  const missingVersion = list.filter((d) => !d.version).length;
  const now = Date.now();
  const stale = list.filter((d) => {
    const t = Date.parse(d.at || 0);
    return Number.isFinite(t) && now - t > 365 * 24 * 60 * 60_000;
  }).length;
  return {
    title: 'LİKYA Belge Kasası Ops',
    total: list.length,
    byCategory: byCat,
    missingUrl,
    missingVersion,
    stale,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      categories: Object.keys(byCat).length,
      missing_url: missingUrl,
      missing_version: missingVersion,
      stale,
    },
    summaryLines: [
      `Belge ${list.length} · kategori ${Object.keys(byCat).length} · URL eksik ${missingUrl}`,
      `Versiyon eksik ${missingVersion} · stale ${stale} · flag ${openFlags.length}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

function addDocumentsFlag(candidate, actor = 'system') {
  const existing = readCollection('documents-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('docf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('documents-flags', list.slice(0, 200));
  return flag;
}

export function runDocumentsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = documentsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.missingUrl > 0) {
    candidates.push({
      key: 'documents_missing_url',
      level: overview.missingUrl > 0 ? 'warn' : 'info',
      text: `URL eksik belge ${overview.missingUrl}`,
      domain: 'metadata',
    });
  }
  if (force || overview.missingVersion > 0) {
    candidates.push({
      key: 'documents_missing_version',
      level: overview.missingVersion > 0 ? 'warn' : 'info',
      text: `Versiyon eksik belge ${overview.missingVersion}`,
      domain: 'version',
    });
  }
  if (force || overview.stale > 0) {
    candidates.push({
      key: 'documents_stale_review',
      level: overview.stale > 0 ? 'alert' : 'info',
      text: `Stale belge review ${overview.stale}`,
      domain: 'review',
    });
  }
  for (const c of candidates) {
    const flag = addDocumentsFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'THEMIS',
        title: `documents sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('docs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('documents-sweeps', sweep, 80);
  appendAudit({ actor, action: 'documents.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: documentsSummary() };
}

export function ackDocumentsFlag(input = {}, actor = 'system') {
  const list = readCollection('documents-flags', []) || [];
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
  writeCollection('documents-flags', list);
  appendAudit({ actor, action: 'documents.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: documentsSummary() };
}

export function reviseDocumentVersion(input = {}, actor = 'system') {
  const list = ensure();
  if (!list.length) return { ok: false, error: 'Belge yok' };
  const idx = list.findIndex((d) => d.id === input.id);
  const targetIdx = idx >= 0 ? idx : 0;
  const current = list[targetIdx];
  const nextVersion = input.version || `${current.version || '1.0'}.ops`;
  list[targetIdx] = {
    ...current,
    version: nextVersion,
    note: input.note || current.note || 'Ops review',
    reviewedAt: new Date().toISOString(),
    reviewedBy: actor,
    at: new Date().toISOString(),
  };
  writeCollection('documents', list);
  appendAudit({ actor, action: 'documents.revise', detail: `${current.title} → ${nextVersion}`, meta: { id: current.id } });
  return { ok: true, document: list[targetIdx], overview: documentsSummary() };
}

export function flagDocumentReview(input = {}, actor = 'system') {
  const list = ensure();
  const doc = list.find((d) => d.id === input.id) || list[0] || null;
  const flag = addDocumentsFlag(
    {
      key: doc ? `documents_manual_review_${doc.id}` : 'documents_manual_review',
      level: input.level || 'warn',
      text: input.text || `Belge review gerekli: ${doc?.title || 'genel'}`,
      domain: 'review',
      documentId: doc?.id,
    },
    actor,
  );
  appendAudit({ actor, action: 'documents.flag_review', detail: doc?.title || 'genel', meta: { flagId: flag?.id } });
  return { ok: true, flag, document: doc, overview: documentsSummary() };
}

export function seedPolicyDocument(input = {}, actor = 'system') {
  const document = createDocument(
    {
      title: input.title || 'Ops Politika Belgesi',
      category: input.category || 'ops',
      brandId: input.brandId || 'brand_likya',
      version: input.version || '1.0',
      url: input.url || '/api/docs',
      note: input.note || 'Ops seed',
    },
    actor,
  );
  appendAudit({ actor, action: 'documents.seed_policy', detail: document.title, meta: { id: document.id } });
  return { ok: true, document, overview: documentsSummary() };
}
