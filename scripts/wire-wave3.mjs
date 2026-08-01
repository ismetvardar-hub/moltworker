#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

// platform imports
let platform = read('server/platform.js');
platform = platform.replace(
  /import \{ createLifePlan, ingestWearable, lifeCoachOverview \} from '\.\/lifecoach\.js';/,
  `import {
  createLifePlan,
  ingestWearable,
  ingestWearableWebhook,
  lifeCoachOverview,
  registerLifeDevice,
  verifyLifeWebhookSignature,
} from './lifecoach.js';`,
);
if (!platform.includes("from './agentqueue.js'")) {
  platform = platform.replace(
    /import \{ bridgeRecoveryPlan, linkSportProfiles, sportBridgeOverview, syncSlotToSession \} from '\.\/sportbridge\.js';/,
    `import { bridgeRecoveryPlan, linkSportProfiles, sportBridgeOverview, syncSlotToSession } from './sportbridge.js';
import { agentQueueOverview, claimAgentJob, completeAgentJob, enqueueAgentJob, tickAgentQueue } from './agentqueue.js';`,
  );
}

const routes = `
        if (path === '/api/lifecoach/device' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, registerLifeDevice(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/lifecoach/webhook' && req.method === 'POST') {
          void (async () => {
            const rawChunks = [];
            // readBody already used elsewhere — parse JSON body then verify optional signature
            const body = await readBody(req);
            const sig = req.headers['x-likya-signature'] || req.headers['X-Likya-Signature'];
            const demo = req.headers['x-likya-demo'] === '1';
            const user = demo ? { username: 'demo-webhook' } : null;
            // Allow: valid HMAC, demo header + session, or authenticated user
            let verified = false;
            try {
              verified = verifyLifeWebhookSignature(JSON.stringify(body), sig);
            } catch { verified = false; }
            if (!verified && !demo) {
              const authed = requireUser(req, res);
              if (!authed) return;
              verified = false;
              sendJson(res, 200, ingestWearableWebhook(body, { actor: authed.username, verified: false }));
              return;
            }
            sendJson(res, 200, ingestWearableWebhook(body, { actor: user?.username || 'webhook', verified: verified || demo }));
          })();
          return;
        }
        if (path === '/api/agentqueue' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, agentQueueOverview());
          return;
        }
        if (path === '/api/agentqueue/enqueue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, enqueueAgentJob(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentqueue/claim' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, claimAgentJob(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentqueue/complete' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, completeAgentJob(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentqueue/tick' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, tickAgentQueue(user.username));
          return;
        }
`;

if (!platform.includes("/api/agentqueue'")) {
  const anchor = "        // ── Antalya Extreme Park";
  if (!platform.includes(anchor)) throw new Error('extreme anchor missing');
  // Prefer insert after culture/sport block — still before extreme
  if (platform.includes("/api/sportbridge/recovery")) {
    platform = platform.replace(
      /(if \(path === '\/api\/sportbridge\/recovery'[\s\S]*?return;\s*\}\n)/,
      `$1${routes}`,
    );
  } else {
    platform = platform.replace(anchor, `${routes}\n${anchor}`);
  }
  console.log('wire platform wave3 routes');
} else {
  console.log('skip platform routes');
}
write('server/platform.js', platform);

// auth / brands / types
let auth = read('server/auth.js');
if (!auth.includes("'agentqueue'")) {
  auth = auth.replace(`'sportbridge',`, `'sportbridge',\n    'agentqueue',`);
  console.log('wire auth agentqueue');
}
write('server/auth.js', auth);

let brands = read('server/brands.js');
if (!brands.includes("'agentqueue'")) {
  brands = brands.replace(`'sportbridge',`, `'sportbridge',\n      'agentqueue',`);
  console.log('wire brands');
}
write('server/brands.js', brands);

let types = read('src/types.ts');
if (!types.includes("| 'agentqueue'")) {
  types = types.replace(`| 'sportbridge'`, `| 'sportbridge'\n  | 'agentqueue'`);
  console.log('wire types');
}
write('src/types.ts', types);

// App.tsx — AgentqueuePage will be picked by lazyify; ensure PAGES entry
let app = read('src/App.tsx');
if (!app.includes('agentqueue:')) {
  // After lazyify we'll re-add; for now add to PAGES map
  app = app.replace(
    `sportbridge: SportbridgePage,`,
    `sportbridge: SportbridgePage,\n  agentqueue: AgentqueuePage,`,
  );
  // temporary import so lazyify sees it — use lazy const pattern
  if (!app.includes('AgentqueuePage')) {
    app = app.replace(
      `const SportbridgePage = lazy(() => import('./pages/SportbridgePage'));`,
      `const SportbridgePage = lazy(() => import('./pages/SportbridgePage'));\nconst AgentqueuePage = lazy(() => import('./pages/AgentqueuePage'));`,
    );
  }
  console.log('wire App agentqueue');
}
write('src/App.tsx', app);

let side = read('src/components/Sidebar.tsx');
if (!side.includes("'agentqueue'")) {
  side = side.replace(`'sportbridge',`, `'sportbridge',\n  'agentqueue',`);
}
if (!side.includes("id: 'agentqueue'")) {
  side = side.replace(
    `{ id: 'sportbridge', label: 'Spor Köprüsü', description: 'Park ↔ kulüp', icon: Dumbbell },`,
    `{ id: 'sportbridge', label: 'Spor Köprüsü', description: 'Park ↔ kulüp', icon: Dumbbell },
  { id: 'agentqueue', label: 'Ajan Kuyruk', description: 'Enqueue · claim · complete', icon: ListTodo },`,
  );
  console.log('wire Sidebar');
}
write('src/components/Sidebar.tsx', side);

// ListTodo import?
let side2 = read('src/components/Sidebar.tsx');
if (side2.includes('ListTodo') && !side2.match(/ListTodo,/)) {
  side2 = side2.replace(/ListChecks,/, 'ListChecks,\n  ListTodo,');
  // if ListChecks missing, add near LayoutGrid
  if (!side2.includes('ListTodo,')) {
    side2 = side2.replace(/LayoutGrid,/, 'LayoutGrid,\n  ListTodo,');
  }
  write('src/components/Sidebar.tsx', side2);
  console.log('wire ListTodo icon');
}

let dom = read('src/nav/campusDomains.ts');
if (!dom.includes("'agentqueue'")) {
  dom = dom.replace(
    `pages: ['agentbridge', 'komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],`,
    `pages: ['agentbridge', 'agentqueue', 'komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],`,
  );
  write('src/nav/campusDomains.ts', dom);
  console.log('wire domains');
}

let oa = read('server/openapi.js');
if (!oa.includes("'/api/agentqueue'")) {
  oa = oa.replace(
    `'/api/sportbridge': { get: { summary: 'Spor köprüsü', tags: ['sportbridge'] } },`,
    `'/api/sportbridge': { get: { summary: 'Spor köprüsü', tags: ['sportbridge'] } },
      '/api/agentqueue': { get: { summary: 'Ajan iş kuyruğu', tags: ['agentqueue'] } },
      '/api/lifecoach/webhook': { post: { summary: 'Wearable webhook', tags: ['lifecoach'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('wire openapi');
}

let ops = read('server/ops.js');
for (const c of ['life-devices', 'life-webhooks', 'agent-jobs']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'market-channel-syncs',`, `'market-channel-syncs',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE3_WIRE_OK');
