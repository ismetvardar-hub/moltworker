#!/usr/bin/env node
/**
 * Inject CrudOpsBar into thin CRUD pages that lack Sweep ops.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pagesDir = new URL('../src/pages/', import.meta.url).pathname;
const serverDir = new URL('../server/', import.meta.url).pathname;

function toPascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function thinDomains() {
  return readdirSync(serverDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => f.slice(0, -3))
    .filter((name) => {
      const src = readFileSync(join(serverDir, `${name}.js`), 'utf8');
      if (/export function run\w+Sweep/.test(src)) return false;
      const p = toPascal(name);
      return (
        src.includes(`export function list${p}`) &&
        src.includes(`export function create${p}`) &&
        src.includes(`export function update${p}`) &&
        src.includes(`export function ${name}Summary`)
      );
    });
}

let patched = 0;
let skipped = 0;
for (const domain of thinDomains()) {
  const pageName = `${toPascal(domain)}Page.tsx`;
  const pagePath = join(pagesDir, pageName);
  if (!existsSync(pagePath)) {
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
  // add import
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
  // inject after <header>...</header>
  if (src.includes('<CrudOpsBar')) {
    skipped += 1;
    continue;
  }
  const headerClose = src.indexOf('</header>');
  if (headerClose < 0) {
    skipped += 1;
    continue;
  }
  const inject = `\n      <CrudOpsBar domain="${domain}" onDone={() => void refresh?.()} />\n`;
  // many pages have refresh(); some don't — use optional refresh via inline
  const hasRefresh = /async function refresh|const refresh =|function refresh\(/.test(src);
  const bar = hasRefresh
    ? `\n      <CrudOpsBar domain="${domain}" onDone={() => void refresh()} />\n`
    : `\n      <CrudOpsBar domain="${domain}" />\n`;
  src = src.slice(0, headerClose + '</header>'.length) + bar + src.slice(headerClose + '</header>'.length);
  writeFileSync(pagePath, src);
  patched += 1;
}

console.log(JSON.stringify({ ok: true, patched, skipped, domains: thinDomains().length }));
