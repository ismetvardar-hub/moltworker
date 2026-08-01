/**
 * AŞAMA 42 — BABEL lokalizasyon / çeviri not defteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

const LANGS = ['tr', 'en', 'de', 'ru'];

function ensureSeed() {
  let list = readCollection('i18n-notes', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'i18n_1',
        key: 'pass.welcome',
        locale: 'de',
        source: 'OlymposPass’e hoş geldiniz',
        translation: 'Willkommen bei OlymposPass',
        status: 'approved',
        module: 'olympospass',
        note: 'Resmi karşılama',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'i18n_2',
        key: 'chef.two_minute',
        locale: 'en',
        source: '2 dakika kuralı',
        translation: '2-minute rule',
        status: 'draft',
        module: 'chef',
        note: 'Mutfak paneli',
        updatedAt: new Date().toISOString(),
      },
    ];
    writeCollection('i18n-notes', list);
  }
  return list;
}

export function listI18nNotes(filter = {}) {
  let list = ensureSeed();
  if (filter.locale) list = list.filter((n) => n.locale === filter.locale);
  if (filter.status) list = list.filter((n) => n.status === filter.status);
  if (filter.module) list = list.filter((n) => n.module === filter.module);
  return list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function upsertI18nNote(input, actor = 'system') {
  const list = ensureSeed();
  const locale = LANGS.includes(input.locale) ? input.locale : 'en';
  let idx = -1;
  if (input.id) idx = list.findIndex((n) => n.id === input.id);
  if (idx < 0 && input.key && locale) {
    idx = list.findIndex((n) => n.key === input.key && n.locale === locale);
  }

  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      source: input.source ?? list[idx].source,
      translation: input.translation ?? list[idx].translation,
      status: input.status || list[idx].status,
      module: input.module || list[idx].module,
      note: input.note ?? list[idx].note,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };
    writeCollection('i18n-notes', list);
    appendAudit({
      actor,
      action: 'i18n.update',
      detail: `${list[idx].key}:${list[idx].locale}`,
      meta: { id: list[idx].id },
    });
    return list[idx];
  }

  const note = {
    id: `i18n_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    key: String(input.key || '').trim() || 'untitled.key',
    locale,
    source: input.source || '',
    translation: input.translation || '',
    status: input.status || 'draft',
    module: input.module || 'general',
    note: input.note || '',
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  prependItem('i18n-notes', note, 500);
  appendAudit({
    actor,
    action: 'i18n.create',
    detail: `${note.key}:${note.locale}`,
    meta: { id: note.id },
  });
  return note;
}

export function removeI18nNote(id, actor = 'system') {
  const n = ensureSeed().find((x) => x.id === id);
  if (!n) return null;
  deleteItem('i18n-notes', id);
  appendAudit({ actor, action: 'i18n.delete', detail: `${n.key}:${n.locale}`, meta: { id } });
  return n;
}

export function i18nSummary() {
  const list = listI18nNotes();
  return {
    total: list.length,
    draft: list.filter((n) => n.status === 'draft').length,
    approved: list.filter((n) => n.status === 'approved').length,
    locales: LANGS,
  };
}
