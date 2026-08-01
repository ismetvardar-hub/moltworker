#!/usr/bin/env node
/**
 * App.tsx: tüm page import'larını lazy()'ye çevir (LoginPage hariç).
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src/App.tsx');
let src = fs.readFileSync(file, 'utf8');

const pageImports = [];
src = src.replace(
  /^import\s+(\w+)\s+from\s+'\.\/pages\/([^']+)';\n/gm,
  (full, name, mod) => {
    if (name === 'LoginPage') return full;
    pageImports.push({ name, mod });
    return '';
  },
);

// Remove existing lazy page consts
src = src.replace(
  /^const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\('\.\/pages\/([^']+)'\)\);\n/gm,
  (full, name, mod) => {
    if (!pageImports.find((p) => p.name === name)) pageImports.push({ name, mod });
    return '';
  },
);

// Dedupe by name
const seen = new Set();
const unique = [];
for (const p of pageImports) {
  if (seen.has(p.name)) continue;
  seen.add(p.name);
  unique.push(p);
}
unique.sort((a, b) => a.name.localeCompare(b.name));

const lazyBlock =
  `\n/** Lazy page chunks — Lab/stage + kampüs (LoginPage eager) */\n` +
  unique.map((p) => `const ${p.name} = lazy(() => import('./pages/${p.mod}'));`).join('\n') +
  `\n`;

// Insert after Docs-related area: after `import DocsPage` was removed, place after LoginPage import
if (!src.includes('import LoginPage from')) {
  throw new Error('LoginPage import missing');
}
src = src.replace(
  /(import LoginPage from '\.\/pages\/LoginPage';\n)/,
  `$1${lazyBlock}`,
);

// Ensure lazy, Suspense imports
if (!src.includes('lazy,')) {
  src = src.replace(
    /from 'react';/,
    `lazy, Suspense, useCallback, useEffect, useState, type ComponentType } from 'react';`,
  );
}

// Ensure Suspense wrapper around ActivePage
if (!src.includes('<Suspense')) {
  src = src.replace(
    /<main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">\s*<ActivePage \/>\s*<\/main>/,
    `<main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Modül yükleniyor…
            </div>
          }
        >
          <ActivePage />
        </Suspense>
      </main>`,
  );
}

fs.writeFileSync(file, src);
console.log(`LAZYIFY_OK pages=${unique.length}`);
