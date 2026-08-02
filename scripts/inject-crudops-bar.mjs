#!/usr/bin/env node
/**
 * Inject CrudOpsBar into thin CRUD pages that lack Sweep ops.
 * Discovery matches server/crudops.js (flexible list/create/update/summary names).
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pagesDir = new URL('../src/pages/', import.meta.url).pathname;
const serverDir = new URL('../server/', import.meta.url).pathname;

function toPascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function thinDomains() {
  const skip = new Set([
    'crudops.js', 'store.js', 'audit.js', 'agentqueue.js', 'platform.js', 'openapi.js',
    'auth.js', 'events.js', 'integrations.js', 'jobs.js', 'settings.js', 'rateLimit.js',
    'metrics.js', 'exports.js', 'readiness.js', 'report.js', 'brief.js', 'digest.js',
  ]);
  return readdirSync(serverDir)
    .filter((f) => f.endsWith('.js') && !skip.has(f))
    .map((f) => f.slice(0, -3))
    .filter((name) => {
      const src = readFileSync(join(serverDir, `${name}.js`), 'utf8');
      if (/export function run\w+Sweep/.test(src)) return false;
      const exported = [...src.matchAll(/export function (\w+)/g)].map((m) => m[1]);
      const listFn = exported.find((e) => /^list[A-Z]/.test(e));
      const createFn = exported.find((e) => /^create[A-Z]/.test(e));
      const updateFn = exported.find((e) => /^update[A-Z]/.test(e));
      const summaryFn =
        exported.find((e) => e === `${name}Summary`) ||
        exported.find((e) => e.endsWith('Summary'));
      if (!listFn || !createFn || !updateFn || !summaryFn) return false;
      if (exported.filter((e) => e.endsWith('Summary')).length > 3) return false;
      return true;
    });
}

function findPagePath(domain) {
  const exact = join(pagesDir, `${toPascal(domain)}Page.tsx`);
  if (existsSync(exact)) return exact;
  const wanted = `${domain}page.tsx`.toLowerCase();
  const hit = readdirSync(pagesDir).find((f) => f.toLowerCase() === wanted);
  return hit ? join(pagesDir, hit) : null;
}

let patched = 0;
let skipped = 0;
const domains = thinDomains();
for (const domain of domains) {
  const pagePath = findPagePath(domain);
  if (!pagePath) {
    skipped += 1;
    continue;
  }
  let src = readFileSync(pagePath, 'utf8');
  if (src.includes('CrudOpsBar') || src.includes('runCrudDomainSweep')) {
    skipped += 1;
    continue;
  }
  if (!src.includes("from 'react'") && !src.includes('from "react"')) {
    skipped += 1;
    continue;
  }
  if (!src.includes("from '../components/CrudOpsBar'")) {
    const importLine = "import CrudOpsBar from '../components/CrudOpsBar'\n";
    if (src.includes("from '../components/PanelCard'")) {
      src = src.replace(
        /import PanelCard from '\.\.\/components\/PanelCard'\n?/,
        (m) => `${m}${importLine}`,
      );
    } else {
      src = importLine + src;
    }
  }
  const headerClose = src.indexOf('</header>');
  if (headerClose < 0) {
    skipped += 1;
    continue;
  }
  const hasRefresh = /async function refresh|const refresh =|function refresh\(/.test(src);
  const bar = hasRefresh
    ? `\n      <CrudOpsBar domain="${domain}" onDone={() => void refresh()} />\n`
    : `\n      <CrudOpsBar domain="${domain}" />\n`;
  src = src.slice(0, headerClose + '</header>'.length) + bar + src.slice(headerClose + '</header>'.length);
  writeFileSync(pagePath, src);
  patched += 1;
}

console.log(JSON.stringify({ ok: true, patched, skipped, domains: domains.length }));
