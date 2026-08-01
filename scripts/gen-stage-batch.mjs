#!/usr/bin/env node
/**
 * Stage batch generator — 14 CRUD + 1 checkpoint.
 * Usage: node scripts/gen-stage-batch.mjs <batch.json>
 */
import fs from 'node:fs';

const batchPath = process.argv[2];
if (!batchPath) {
  console.error('Usage: node scripts/gen-stage-batch.mjs <batch.json>');
  process.exit(1);
}

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const { stages, checkpoint, prevCheckpoint, sectionTitle, openapiFrom, openapiTo } = batch;

const reserved = new Set(fs.readdirSync('server').filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')));
const ALWAYS = new Set([
  'events', 'auth', 'store', 'jobs', 'pass', 'brands', 'integrations', 'platform',
  'openapi', 'ops', 'audit', 'rateLimit', 'search-proxy', 'prod-server', 'metrics',
  'report', 'webhooks', 'notifications', 'guests', 'venues', 'settings', 'playbooks',
]);

function pascal(id) {
  return id[0].toUpperCase() + id.slice(1);
}

for (const s of stages) {
  if (reserved.has(s.id) || ALWAYS.has(s.id)) throw new Error('COLLIDE ' + s.id);
}
if (reserved.has(checkpoint.id) || ALWAYS.has(checkpoint.id)) throw new Error('COLLIDE ' + checkpoint.id);

const RESERVED_VARS = new Set(['eval','arguments','await','yield','let','const','var','class','return','default','import','export']);
for (const sig of checkpoint.signals || []) {
  if (RESERVED_VARS.has(sig.varName)) throw new Error('RESERVED varName ' + sig.varName);
}
const iconMod = await import('lucide-react');
for (const s of stages) {
  if (!iconMod[s.icon]) throw new Error('Missing icon ' + s.icon);
}
if (!iconMod[checkpoint.icon]) throw new Error('Missing checkpoint icon ' + checkpoint.icon);

for (const s of stages) {
  const P = pascal(s.id);
  const fieldEntries = Object.entries(s.fields);
  const seedObj = fieldEntries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(',\n      ');
  const createDefaults = fieldEntries
    .map(([k, v]) => {
      if ((s.numberFields || []).includes(k)) {
        return `${k}: input.${k} !== undefined ? Number(input.${k}) || 0 : ${Number(v) || 0}`;
      }
      return `${k}: input.${k} !== undefined ? input.${k} : ${JSON.stringify(v)}`;
    })
    .join(',\n    ');
  const statusCounts = s.statuses
    .map((st) => `${st}: list.filter((x) => x.status === '${st}').length`)
    .join(',\n    ');

  fs.writeFileSync(
    `server/${s.id}.js`,
    `/**
 * AŞAMA ${s.stage} — ${s.title}.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('${s.collection}', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: '${s.prefix}_1', ${seedObj}, status: '${s.statuses[0]}', at: new Date().toISOString() }];
    writeCollection('${s.collection}', seed);
    return seed;
  }
  return list;
}
export function list${P}(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function create${P}(input, actor = 'system') {
  const row = {
    id: \`${s.prefix}_\${Date.now().toString(36)}_\${randomBytes(2).toString('hex')}\`,
    ${createDefaults},
    status: input.status || '${s.statuses[0]}',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('${s.collection}', row, 300);
  appendAudit({
    actor,
    action: '${s.id}.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function update${P}(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('${s.collection}', list);
  appendAudit({ actor, action: '${s.id}.update', detail: \`\${id} → \${list[idx].status || 'ok'}\`, meta: { id } });
  return list[idx];
}
export function ${s.id}Summary() {
  const list = list${P}();
  return { total: list.length, ${statusCounts}, ${s.id}: list };
}
`,
  );

  fs.writeFileSync(
    `src/services/${s.id}.ts`,
    `import { authHeaders } from './auth'
async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || \`HTTP \${res.status}\`)
  return data
}
export async function fetch${P}(): Promise<any> {
  return parse(await fetch('/api/${s.id}', { headers: authHeaders() }))
}
export async function create${P}(input: Record<string, unknown>): Promise<any> {
  return parse(await fetch('/api/${s.id}', { method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(input)}))
}
export async function patch${P}(id: string, patch: Record<string, unknown>): Promise<any> {
  return parse(await fetch(\`/api/${s.id}/\${encodeURIComponent(id)}\`, { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(patch)}))
}
`,
  );

  const formState = Object.fromEntries(fieldEntries);
  const inputs = fieldEntries
    .map(
      ([k]) =>
        `          <input className="rounded-md border border-obsidian-600 bg-obsidian-950 px-2 py-2 text-sm text-slate-100" placeholder="${k}" value={String(form.${k}??'')} onChange={(e)=>setForm(f=>({...f,${k}:e.target.value}))} />`,
    )
    .join('\n');
  const statusBtns = s.statuses
    .map(
      (st) =>
        `<button type="button" className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px] text-slate-300" onClick={()=>void patch${P}(r.id,{status:'${st}'}).then(()=>refresh()).catch(e=>setError(String(e.message||e)))}>${st}</button>`,
    )
    .join('\n                ');

  fs.writeFileSync(
    `src/pages/${P}Page.tsx`,
    `import { FormEvent, useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { create${P}, fetch${P}, patch${P} } from '../services/${s.id}'
export default function ${P}Page() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string,string>>(${JSON.stringify(formState)})
  async function refresh() {
    try { const data = await fetch${P}(); setRows(data.${s.id} || []); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
  }
  useEffect(()=>{ void refresh() }, [])
  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form }
      for (const k of ['qty','value','score','amount','price','points','limit','ms','pct','count','level']) if (k in payload) payload[k]=Number(payload[k])||0
      await create${P}(payload); await refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kayıt başarısız') }
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">${s.title}</h1>
        <p className="mt-1 text-sm text-slate-400">${s.desc}</p>
      </header>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <PanelCard title="Yeni">
        <form onSubmit={(e)=>void onCreate(e)} className="grid gap-2 md:grid-cols-3">
${inputs}
          <button type="submit" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm font-medium text-obsidian-950 md:col-span-3 md:w-fit">Kaydet</button>
        </form>
      </PanelCard>
      <PanelCard title={\`Liste (\${rows.length})\`}>
        <ul className="space-y-2 text-sm">
          {rows.map((r)=>(
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 px-3 py-2">
              <div className="text-slate-200">
                {r.title||r.name||r.guestName||r.label||r.code||r.zone||r.sku||r.metric||r.id}
                {r.status ? <span className="ml-2 text-xs text-slate-500">{r.status}</span> : null}
                <div className="text-xs text-slate-500">{r.note||r.detail||r.channel||''}</div>
              </div>
              <div className="flex flex-wrap gap-1">${statusBtns}</div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
`,
  );
}

// Checkpoint server
const cp = checkpoint;
const Cp = pascal(cp.id);
const Prev = pascal(prevCheckpoint.id);

fs.writeFileSync(
  `server/${cp.id}.js`,
  `/**
 * AŞAMA ${cp.stage} — ${cp.title} checkpoint.
 */
import { build${Prev} } from './${prevCheckpoint.id}.js';
${(cp.signals || []).map((sig) => `import { ${sig.summaryFn} } from './${sig.module}.js';`).join('\n')}

export function build${Cp}() {
  const prev = build${Prev}();
${(cp.signals || []).map((sig) => `  const ${sig.varName} = ${sig.summaryFn}();`).join('\n')}
  return {
    generatedAt: new Date().toISOString(),
    title: ${JSON.stringify(cp.fullTitle || cp.title)},
    ${prevCheckpoint.id}: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
${(cp.signals || []).map((sig) => `    ${sig.key}: ${sig.varName}.${sig.field} || 0,`).join('\n')}
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
${(cp.summaryLines || []).map((l) => `      \`${l}\`,`).join('\n')}
    ],
  };
}
`,
);

fs.writeFileSync(
  `src/services/${cp.id}.ts`,
  `import { authHeaders } from './auth'
export async function fetch${Cp}() {
  const res = await fetch('/api/${cp.id}', { headers: authHeaders() })
  if (!res.ok) throw new Error('${cp.title} alınamadı')
  return res.json()
}
`,
);

fs.writeFileSync(
  `src/pages/${Cp}Page.tsx`,
  `import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import { fetch${Cp} } from '../services/${cp.id}'
export default function ${Cp}Page() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { void fetch${Cp}().then(setData).catch((e)=>setError(e instanceof Error?e.message:'Hata')) }, [])
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">${cp.title}</h1>
        <p className="mt-1 text-sm text-slate-400">AŞAMA ${cp.stage} — ${cp.desc}</p>
      </header>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {data && (
        <PanelCard title={data.title}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {(data.summaryLines||[]).map((l:string)=><li key={l}>{l}</li>)}
          </ul>
        </PanelCard>
      )}
    </div>
  )
}
`,
);

const ids = stages.map((s) => s.id).concat([cp.id]);

// platform
let platform = fs.readFileSync('server/platform.js', 'utf8');
const importBlock =
  stages
    .map((s) => {
      const P = pascal(s.id);
      return `import {\n  create${P},\n  list${P},\n  ${s.id}Summary,\n  update${P},\n} from './${s.id}.js';`;
    })
    .join('\n') + `\nimport { build${Cp} } from './${cp.id}.js';\n`;

const prevBuild = `build${Prev}`;
if (!platform.includes(`from './${cp.id}.js'`)) {
  const prevImport = `import { ${prevBuild} } from './${prevCheckpoint.id}.js';\n`;
  if (!platform.includes(prevImport.trim())) {
    // try looser
    const re = new RegExp(`import \\{ ${prevBuild} \\} from '\\./${prevCheckpoint.id}\\.js';\\n`);
    if (!re.test(platform)) throw new Error('prev checkpoint import not found: ' + prevCheckpoint.id);
    platform = platform.replace(re, (m) => m + importBlock);
  } else {
    platform = platform.replace(prevImport, prevImport + importBlock);
  }
}

const routeBlock =
  stages
    .map((s) => {
      const P = pascal(s.id);
      return `
        if (path === '/api/${s.id}' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ${s.id}Summary());
          return;
        }
        if (path === '/api/${s.id}' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: create${P}(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/${s.id}/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = update${P}(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }
`;
    })
    .join('\n') +
  `
        if (path === '/api/${cp.id}' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, build${Cp}());
          return;
        }
`;

if (!platform.includes(`path === '/api/${cp.id}'`)) {
  const anchor = `        if (path === '/api/${prevCheckpoint.id}' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ${prevBuild}());
          return;
        }

        next();`;
  if (!platform.includes(anchor)) throw new Error('route anchor not found for ' + prevCheckpoint.id);
  platform = platform.replace(
    anchor,
    `        if (path === '/api/${prevCheckpoint.id}' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ${prevBuild}());
          return;
        }

        // ── ${sectionTitle} ──
${routeBlock}
        next();`,
  );
}
fs.writeFileSync('server/platform.js', platform);

let auth = fs.readFileSync('server/auth.js', 'utf8');
if (!auth.includes(`'${cp.id}'`)) {
  auth = auth.replace(
    `    '${prevCheckpoint.id}',\n    'docs',`,
    `    '${prevCheckpoint.id}',\n${ids.map((i) => `    '${i}',`).join('\n')}\n    'docs',`,
  );
}
fs.writeFileSync('server/auth.js', auth);

let types = fs.readFileSync('src/types.ts', 'utf8');
if (!types.includes(`'${cp.id}'`)) {
  types = types.replace(`  | '${prevCheckpoint.id}'\n`, `  | '${prevCheckpoint.id}'\n${ids.map((i) => `  | '${i}'`).join('\n')}\n`);
}
fs.writeFileSync('src/types.ts', types);

let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes(`${Cp}Page`)) {
  const PrevPage = `${Prev}Page`;
  app = app.replace(
    `import ${PrevPage} from './pages/${PrevPage}';\n`,
    `import ${PrevPage} from './pages/${PrevPage}';\n${ids.map((i) => `import ${pascal(i)}Page from './pages/${pascal(i)}Page';`).join('\n')}\n`,
  );
  app = app.replace(
    `  ${prevCheckpoint.id}: ${PrevPage},\n`,
    `  ${prevCheckpoint.id}: ${PrevPage},\n${ids.map((i) => `  ${i}: ${pascal(i)}Page,`).join('\n')}\n`,
  );
}
fs.writeFileSync('src/App.tsx', app);

let side = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
const neededIcons = [...new Set(stages.map((s) => s.icon).concat([cp.icon]))];
const missingIcons = neededIcons.filter((i) => !side.includes(`  ${i},`) && !side.includes(`  ${i}\n`));
if (missingIcons.length) {
  side = side.replace(/} from 'lucide-react';/, missingIcons.map((i) => `  ${i},`).join('\n') + `\n} from 'lucide-react';`);
}
if (!side.includes(`'${cp.id}'`)) {
  side = side.replace(`  '${prevCheckpoint.id}',\n]);`, `  '${prevCheckpoint.id}',\n  '${cp.id}',\n]);`);
}
const navEntries =
  stages.map((s) => `  { id: '${s.id}', label: '${s.title}', description: '${s.desc}', icon: ${s.icon} },`).join('\n') +
  `\n  { id: '${cp.id}', label: '${cp.title}', description: 'AŞAMA ${cp.stage} ${cp.shortDesc || cp.desc}', icon: ${cp.icon} },`;

if (!side.includes(`id: '${stages[0].id}'`)) {
  const prevNavRe = new RegExp(`\\{ id: '${prevCheckpoint.id}', label: '[^']+', description: '[^']*', icon: [^}]+ \\},`);
  if (!prevNavRe.test(side)) throw new Error('prev nav not found: ' + prevCheckpoint.id);
  side = side.replace(prevNavRe, (m) => `${navEntries}\n  ${m}`);
}
fs.writeFileSync('src/components/Sidebar.tsx', side);

let brands = fs.readFileSync('server/brands.js', 'utf8');
if (!brands.includes(`'${cp.id}'`)) {
  brands = brands.replace(
    `      '${prevCheckpoint.id}',
    ],
    venueIds: ['venue_olympos_beach', 'venue_kaleici', 'venue_phaseelis'],
    status: 'active',
  },
];`,
    `      '${prevCheckpoint.id}',
${ids.map((i) => `      '${i}',`).join('\n')}
    ],
    venueIds: ['venue_olympos_beach', 'venue_kaleici', 'venue_phaseelis'],
    status: 'active',
  },
];`,
  );
}
fs.writeFileSync('server/brands.js', brands);

let ops = fs.readFileSync('server/ops.js', 'utf8');
if (!ops.includes(`'${stages[0].collection}'`)) {
  ops = ops.replace(`  'lockers',\n`, `  'lockers',\n${stages.map((s) => `  '${s.collection}',`).join('\n')}\n`);
}
fs.writeFileSync('server/ops.js', ops);

let oapi = fs.readFileSync('server/openapi.js', 'utf8');
oapi = oapi.replace(openapiFrom, openapiTo);
if (!oapi.includes(`'/api/${cp.id}':`)) {
  const paths =
    stages.map((s) => `      '/api/${s.id}': { get: { summary: '${s.title}', tags: ['${s.id}'] } },`).join('\n') +
    `\n      '/api/${cp.id}': { get: { summary: '${cp.title}', tags: ['${cp.id}'] } },`;
  oapi = oapi.replace(
    `      '/api/${prevCheckpoint.id}': { get: { summary: '${prevCheckpoint.openapiSummary || pascal(prevCheckpoint.id)}', tags: ['${prevCheckpoint.id}'] } },`,
    `      '/api/${prevCheckpoint.id}': { get: { summary: '${prevCheckpoint.openapiSummary || pascal(prevCheckpoint.id)}', tags: ['${prevCheckpoint.id}'] } },\n${paths}`,
  );
  // fallback if summary text differs
  if (!oapi.includes(`'/api/${cp.id}':`)) {
    const looser = new RegExp(`('/api/${prevCheckpoint.id}': \\{ get: \\{ summary: '[^']*', tags: \\['${prevCheckpoint.id}'\\] \\} \\},)`);
    if (!looser.test(oapi)) throw new Error('openapi prev path not found');
    oapi = oapi.replace(looser, `$1\n${paths}`);
  }
}
fs.writeFileSync('server/openapi.js', oapi);

let readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes(cp.title) || !readme.includes(`**${cp.stage}**`)) {
  const rows = stages.map((s) => `| **${s.stage}** | ${s.title} |`).join('\n') + `\n| **${cp.stage}** | ${cp.title} checkpoint (\`/api/${cp.id}\`) |`;
  const marker = `| **${prevCheckpoint.stage}** |`;
  // insert section before ajan kadrosu
  if (!readme.includes(`(/api/${cp.id})`)) {
    readme = readme.replace(
      `\n### LİKYA Holding Ajan Kadrosu`,
      `\n### ${sectionTitle}\n\n| Aşama | Özellik |\n|-------|---------|\n${rows}\n\n### LİKYA Holding Ajan Kadrosu`,
    );
  }
}
fs.writeFileSync('README.md', readme);

if (!fs.readFileSync('server/integrations.js', 'utf8').includes('integrationsPlugin')) throw new Error('integrations broken');
if (!fs.readFileSync('server/events.js', 'utf8').includes('broadcast')) throw new Error('events broken');
console.log('OK', ids.join(','));
