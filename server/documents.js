/**
 * AŞAMA 51 — Belge kasası (meta + not; dosya yolu opsiyonel).
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

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
  return { total: list.length, byCategory: byCat };
}
