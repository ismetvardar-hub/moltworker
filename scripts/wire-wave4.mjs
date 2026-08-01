#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');
if (!platform.includes("from './greenpulse.js'")) {
  platform = platform.replace(
    /import \{ agentQueueOverview, claimAgentJob, completeAgentJob, enqueueAgentJob, tickAgentQueue \} from '\.\/agentqueue\.js';/,
    `import { agentQueueOverview, claimAgentJob, completeAgentJob, enqueueAgentJob, tickAgentQueue } from './agentqueue.js';
import { addGreenIncident, greenPulseOverview, recordGreenMeter } from './greenpulse.js';`,
  );
}
if (!platform.includes('processLifeFlags')) {
  platform = platform.replace(
    /registerLifeDevice,\n  verifyLifeWebhookSignature,\n\} from '\.\/lifecoach\.js';/,
    `processLifeFlags,\n  registerLifeDevice,\n  verifyLifeWebhookSignature,\n} from './lifecoach.js';`,
  );
}

const routes = `
        if (path === '/api/lifecoach/flags' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, processLifeFlags(user.username));
          return;
        }
        if (path === '/api/greenpulse' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, greenPulseOverview());
          return;
        }
        if (path === '/api/greenpulse/meter' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, recordGreenMeter(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/incident' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, addGreenIncident(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/greenpulse'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/agentqueue\/tick'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('wire platform routes');
}
write('server/platform.js', platform);

let auth = read('server/auth.js');
if (!auth.includes("'greenpulse'")) {
  auth = auth.replace(`'agentqueue',`, `'agentqueue',\n    'greenpulse',`);
  write('server/auth.js', auth);
  console.log('auth');
}

let brands = read('server/brands.js');
if (!brands.includes("'greenpulse'")) {
  brands = brands.replace(`'agentqueue',`, `'agentqueue',\n      'greenpulse',`);
  write('server/brands.js', brands);
  console.log('brands');
}

let types = read('src/types.ts');
if (!types.includes("| 'greenpulse'")) {
  types = types.replace(`| 'agentqueue'`, `| 'agentqueue'\n  | 'greenpulse'`);
  write('src/types.ts', types);
  console.log('types');
}

let app = read('src/App.tsx');
if (!app.includes('const GreenpulsePage')) {
  app = app.replace(
    /(const AgentqueuePage = lazy\(\(\) => import\('\.\/pages\/AgentqueuePage'\)\);)/,
    `$1\nconst GreenpulsePage = lazy(() => import('./pages/GreenpulsePage'));`,
  );
}
if (!app.includes('greenpulse:')) {
  app = app.replace(
    `agentqueue: AgentqueuePage,`,
    `agentqueue: AgentqueuePage,\n  greenpulse: GreenpulsePage,`,
  );
  console.log('App');
}
write('src/App.tsx', app);

let side = read('src/components/Sidebar.tsx');
if (!side.includes("'greenpulse'")) {
  side = side.replace(`'agentqueue',`, `'agentqueue',\n  'greenpulse',`);
}
if (!side.includes("id: 'greenpulse'")) {
  side = side.replace(
    `{ id: 'agentqueue', label: 'Ajan Kuyruk', description: 'Enqueue · claim · complete', icon: ListTodo },`,
    `{ id: 'agentqueue', label: 'Ajan Kuyruk', description: 'Enqueue · claim · complete', icon: ListTodo },
  { id: 'greenpulse', label: 'Yeşil ESG', description: 'Orman · su · enerji · karbon', icon: Trees },`,
  );
  console.log('Sidebar');
}
write('src/components/Sidebar.tsx', side);

let dom = read('src/nav/campusDomains.ts');
dom = dom.replace(
  `primary: 'campuscore',
    pages: ['campuscore', 'verdant', 'reefwatch', 'solaryield', 'wateruse', 'weather'],`,
  `primary: 'greenpulse',
    pages: ['greenpulse', 'campuscore', 'verdant', 'reefwatch', 'solaryield', 'wateruse', 'weather'],`,
);
write('src/nav/campusDomains.ts', dom);
console.log('domains');

let oa = read('server/openapi.js');
if (!oa.includes("'/api/greenpulse'")) {
  oa = oa.replace(
    `'/api/agentqueue': { get: { summary: 'Ajan iş kuyruğu', tags: ['agentqueue'] } },`,
    `'/api/agentqueue': { get: { summary: 'Ajan iş kuyruğu', tags: ['agentqueue'] } },
      '/api/greenpulse': { get: { summary: 'Yeşil ESG nabız', tags: ['greenpulse'] } },
      '/api/lifecoach/flags': { post: { summary: 'Life flag otomasyonu', tags: ['lifecoach'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['green-meters', 'green-readings', 'green-incidents']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-jobs',`, `'agent-jobs',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

// lifecoach client flags endpoint
let lifeSvc = read('src/services/lifecoach.ts');
if (!lifeSvc.includes('processLifeFlags')) {
  lifeSvc += `
export async function processLifeFlags() {
  return parse(
    await fetch('/api/lifecoach/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: '{}',
    }),
  )
}
`;
  write('src/services/lifecoach.ts', lifeSvc);
  console.log('life svc');
}

console.log('WAVE4_WIRE_OK');
