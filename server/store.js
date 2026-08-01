/**
 * AŞAMA 4 — Kalıcı JSON depo (dosya tabanlı, bağımlılıksız).
 * data/ dizininde koleksiyonlar saklanır.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fileFor(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

export function readCollection(collection, fallback = []) {
  ensureDir();
  const file = fileFor(collection);
  if (!fs.existsSync(file)) return structuredClone(fallback);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return structuredClone(fallback);
  }
}

export function writeCollection(collection, data) {
  ensureDir();
  fs.writeFileSync(fileFor(collection), JSON.stringify(data, null, 2), 'utf8');
}

export function prependItem(collection, item, max = 200) {
  const list = readCollection(collection, []);
  const next = [item, ...list.filter((x) => x.id !== item.id)].slice(0, max);
  writeCollection(collection, next);
  return next;
}

export function deleteItem(collection, id) {
  const next = readCollection(collection, []).filter((x) => x.id !== id);
  writeCollection(collection, next);
  return next;
}

export function clearCollection(collection) {
  writeCollection(collection, []);
}
