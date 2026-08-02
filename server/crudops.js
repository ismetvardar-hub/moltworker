/**
 * Generic CRUD domain ops — thickens all thin list/create/update/summary modules
 * without per-file boilerplate. Used by platform catch-all routes.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function toPascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function parseStatuses(src) {
  const keys = [...src.matchAll(/(\w+):\s*list\.filter\(\(x\) => x\.status === '\1'\)\.length/g)].map((m) => m[1]);
  if (keys.length >= 2) return keys.slice(0, 3);
  const alt = [...src.matchAll(/\.filter\(\((?:x|i|r|row)\) => (?:x|i|r|row)\.status === '([^']+)'\)/g)].map((m) => m[1]);
  const uniq = [...new Set(alt)];
  if (uniq.length >= 2) return uniq.slice(0, 3);
  const def = src.match(/status:\s*input\.status\s*\|\|\s*'([^']+)'/);
  if (def) return [def[1], 'active', 'closed'];
  return ['open', 'active', 'closed'];
}

let _registry = null;

/** Discover thin CRUD domains (have list/create/update/summary, no run*Sweep). */
export function listCrudDomains({ force = false } = {}) {
  if (_registry && !force) return _registry;
  const files = readdirSync(__dirname).filter((f) => f.endsWith('.js'));
  const skip = new Set([
    'crudops.js', 'store.js', 'audit.js', 'agentqueue.js', 'platform.js', 'openapi.js',
    'auth.js', 'events.js', 'integrations.js', 'jobs.js', 'settings.js', 'rateLimit.js',
  ]);
  const out = [];
  for (const file of files) {
    if (skip.has(file)) continue;
    const name = file.slice(0, -3);
    let src;
    try { src = readFileSync(join(__dirname, file), 'utf8'); } catch { continue; }
    if (/export function run\w+Sweep/.test(src)) continue;
    const pascal = toPascal(name);
    if (!src.includes(`export function list${pascal}`)) continue;
    if (!src.includes(`export function create${pascal}`)) continue;
    if (!src.includes(`export function update${pascal}`)) continue;
    const summaryName = `${name}Summary`;
    if (!src.includes(`export function ${summaryName}`)) continue;
    const statuses = parseStatuses(src);
    out.push({ name, file, pascal, summaryName, statuses, collection: `${name}-flags` });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  _registry = out;
  return out;
}

export function crudopsOverview() {
  const domains = listCrudDomains();
  return {
    title: 'LİKYA CRUD Ops Registry',
    generatedAt: new Date().toISOString(),
    total: domains.length,
    sample: domains.slice(0, 40).map((d) => ({ name: d.name, statuses: d.statuses })),
    summaryLines: [
      `${domains.length} ince CRUD domain kayıtlı`,
      'Generic sweep / ack / advance / heal / seed uçları aktif',
    ],
  };
}

const modCache = new Map();

async function loadDomain(name) {
  if (modCache.has(name)) return modCache.get(name);
  const meta = listCrudDomains().find((d) => d.name === name);
  if (!meta) return null;
  const href = pathToFileURL(join(__dirname, meta.file)).href;
  const mod = await import(href);
  const api = {
    meta,
    list: mod[`list${meta.pascal}`],
    create: mod[`create${meta.pascal}`],
    update: mod[`update${meta.pascal}`],
    summary: mod[meta.summaryName],
  };
  if (![api.list, api.create, api.update, api.summary].every((f) => typeof f === 'function')) return null;
  modCache.set(name, api);
  return api;
}

function openFlags(collection) {
  const list = readCollection(collection, []) || [];
  return Array.isArray(list) ? list.filter((f) => f.status === 'open') : [];
}

export async function runCrudDomainSweep(name, input = {}, actor = 'system') {
  const api = await loadDomain(name);
  if (!api) return { ok: false, error: `Domain yok: ${name}` };
  const force = !!input.force;
  const sum = api.summary() || {};
  const statuses = api.meta.statuses;
  const s0 = Number(sum[statuses[0]] || 0);
  const s1 = Number(sum[statuses[1]] || 0);
  const s2 = statuses[2] ? Number(sum[statuses[2]] || 0) : 0;
  const existing = readCollection(api.meta.collection, []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || s0 > 0) {
    candidates.push({ key: `${statuses[0]}_backlog`, level: s0 > 5 ? 'alert' : 'warn', text: `${statuses[0]} ${s0}`, domain: statuses[0] });
  }
  if (force || s1 > 0) {
    candidates.push({ key: `${statuses[1]}_flow`, level: 'info', text: `${statuses[1]} ${s1}`, domain: statuses[1] });
  }
  if (force || s2 > 0) {
    candidates.push({ key: `${statuses[2] || 'done'}_done`, level: 'info', text: `${statuses[2] || 'done'} ${s2}`, domain: statuses[2] || 'done' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: `${name} heartbeat OK`, domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid(`${name.slice(0, 3)}f`), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection(api.meta.collection, list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({
      agent: 'NEXUS',
      title: `${name} sweep · ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { domain: name, flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid(`${name.slice(0, 3)}s`), domain: name, created: created.length, at: new Date().toISOString(), actor };
  prependItem(`${name}-sweeps`, sweep, 80);
  appendAudit({ actor, action: `${name}.sweep`, detail: `${created.length} flag`, meta: { domain: name, id: sweep.id } });
  return { ok: true, sweep, created, summary: api.summary(), flags: openFlags(api.meta.collection).slice(0, 30) };
}

export async function ackCrudDomainFlag(name, input = {}, actor = 'system') {
  const api = await loadDomain(name);
  if (!api) return { ok: false, error: `Domain yok: ${name}` };
  const list = readCollection(api.meta.collection, []) || [];
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
  writeCollection(api.meta.collection, list);
  appendAudit({ actor, action: `${name}.ack`, detail: list[idx].text, meta: { domain: name, id: list[idx].id } });
  return { ok: true, flag: list[idx], flags: openFlags(api.meta.collection).slice(0, 30), summary: api.summary() };
}

export async function advanceCrudDomain(name, input = {}, actor = 'system') {
  const api = await loadDomain(name);
  if (!api) return { ok: false, error: `Domain yok: ${name}` };
  const [from, to] = api.meta.statuses;
  const rows = api.list().filter((x) => x.status === from);
  const advanced = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = api.update(row.id, { status: to, touched_by: actor }, actor);
    if (next) advanced.push(next.id);
  }
  if (!advanced.length) {
    const seeded = api.create({ status: to }, actor);
    advanced.push(seeded.id);
  }
  appendAudit({ actor, action: `${name}.advance`, detail: `${from}→${to} · ${advanced.length}`, meta: { domain: name, n: advanced.length } });
  return { ok: true, advanced, from, to, summary: api.summary() };
}

export async function healCrudDomain(name, input = {}, actor = 'system') {
  const api = await loadDomain(name);
  if (!api) return { ok: false, error: `Domain yok: ${name}` };
  const statuses = api.meta.statuses;
  const healthy = statuses[statuses.length - 1] || 'closed';
  const bad = statuses.slice(0, -1);
  const rows = api.list().filter((x) => bad.includes(x.status));
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = api.update(row.id, { status: healthy, touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = api.create({ status: healthy }, actor);
    healed.push(seeded.id);
  }
  appendAudit({ actor, action: `${name}.heal`, detail: `→${healthy} · ${healed.length}`, meta: { domain: name, n: healed.length } });
  return { ok: true, healed, healthy, summary: api.summary() };
}

export async function seedCrudDomain(name, input = {}, actor = 'system') {
  const api = await loadDomain(name);
  if (!api) return { ok: false, error: `Domain yok: ${name}` };
  const status = input.status || api.meta.statuses[0];
  const row = api.create({ ...(input.fields || {}), status }, actor);
  appendAudit({ actor, action: `${name}.seed`, detail: row.id, meta: { domain: name, id: row.id } });
  return { ok: true, item: row, summary: api.summary() };
}

export async function buildCrudDomain(name) {
  const api = await loadDomain(name);
  if (!api) return null;
  const sum = api.summary() || {};
  const flags = openFlags(api.meta.collection);
  return {
    generatedAt: new Date().toISOString(),
    title: `LİKYA ${api.meta.pascal}`,
    domain: name,
    statuses: api.meta.statuses,
    summary: { ...sum, flags_open: flags.length },
    flags: flags.slice(0, 30),
    summaryLines: [
      `${name} total ${sum.total ?? api.list().length}`,
      api.meta.statuses.map((s) => `${s} ${sum[s] ?? 0}`).join(' · '),
      `Flag ${flags.length} açık`,
    ],
  };
}

/** Sync predicate — use before async handle to short-circuit middleware. */
export function isCrudOpsPath(path, method) {
  if (!path.startsWith('/api/') || method === 'OPTIONS') return false;
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'api' && parts[1] === 'crudops' && method === 'GET') return true;
  if (parts[0] !== 'api') return false;
  if (parts.length === 4 && parts[2] === 'flag' && parts[3] === 'ack' && method === 'POST') {
    return listCrudDomains().some((d) => d.name === parts[1]);
  }
  if (parts.length !== 3) return false;
  const action = parts[2];
  if (!['ops', 'sweep', 'advance', 'heal', 'seed'].includes(action)) return false;
  if (action === 'ops' && method !== 'GET') return false;
  if (action !== 'ops' && method !== 'POST') return false;
  return listCrudDomains().some((d) => d.name === parts[1]);
}

/** Returns true if path was handled. */
export async function handleCrudOpsRoute(path, method, req, res, { requireUser, readBody, sendJson }) {
  if (!isCrudOpsPath(path, method)) return false;
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 2 && parts[1] === 'crudops' && method === 'GET') {
    if (!requireUser(req, res)) return true;
    sendJson(res, 200, crudopsOverview());
    return true;
  }

  // /api/:domain/flag/ack
  if (parts.length === 4 && parts[2] === 'flag' && parts[3] === 'ack' && method === 'POST') {
    const domain = parts[1];
    const user = requireUser(req, res);
    if (!user) return true;
    sendJson(res, 200, await ackCrudDomainFlag(domain, await readBody(req), user.username));
    return true;
  }

  const domain = parts[1];
  const action = parts[2];

  if (action === 'ops' && method === 'GET') {
    if (!requireUser(req, res)) return true;
    const overview = await buildCrudDomain(domain);
    if (!overview) { sendJson(res, 404, { error: 'Domain yok' }); return true; }
    sendJson(res, 200, overview);
    return true;
  }

  const user = requireUser(req, res);
  if (!user) return true;
  const body = await readBody(req);
  if (action === 'sweep') {
    sendJson(res, 200, await runCrudDomainSweep(domain, body, user.username));
    return true;
  }
  if (action === 'advance') {
    sendJson(res, 200, await advanceCrudDomain(domain, body, user.username));
    return true;
  }
  if (action === 'heal') {
    sendJson(res, 200, await healCrudDomain(domain, body, user.username));
    return true;
  }
  if (action === 'seed') {
    sendJson(res, 200, await seedCrudDomain(domain, body, user.username));
    return true;
  }
  return false;
}

// warm registry once
if (existsSync(__dirname)) {
  try { listCrudDomains(); } catch { /* ignore */ }
}
