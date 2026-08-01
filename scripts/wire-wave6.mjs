#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');
if (!platform.includes("from './agentfleet.js'")) {
  platform = platform.replace(
    /import \{ campusBriefOverview, runCampusAutomations \} from '\.\/campusbrief\.js';/,
    `import { campusBriefOverview, runCampusAutomations } from './campusbrief.js';
import { agentFleetOverview, dispatchFleetDirective, pingFleetAgent } from './agentfleet.js';`,
  );
}

const routes = `
        if (path === '/api/agentfleet' && req.method === 'GET') {
          const u = requireUser(req, res);
          if (!u) return;
          sendJson(res, 200, agentFleetOverview());
          return;
        }
        if (path === '/api/agentfleet/ping' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, pingFleetAgent(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentfleet/dispatch' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, dispatchFleetDirective(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/agentfleet'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/campusbrief\/auto'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('platform');
}
write('server/platform.js', platform);

for (const [file, indent] of [
  ['server/auth.js', '    '],
  ['server/brands.js', '      '],
]) {
  let s = read(file);
  if (!s.includes("'agentfleet'")) {
    s = s.replace(`'campusbrief',`, `'campusbrief',\n${indent}'agentfleet',`);
    write(file, s);
    console.log(file);
  }
}

let types = read('src/types.ts');
if (!types.includes("| 'agentfleet'")) {
  types = types.replace(`| 'campusbrief'`, `| 'campusbrief'\n  | 'agentfleet'`);
  write('src/types.ts', types);
}

let app = read('src/App.tsx');
if (!app.includes('const AgentfleetPage')) {
  app = app.replace(
    /(const CampusbriefPage = lazy\(\(\) => import\('\.\/pages\/CampusbriefPage'\)\);)/,
    `$1\nconst AgentfleetPage = lazy(() => import('./pages/AgentfleetPage'));`,
  );
}
if (!app.includes('agentfleet:')) {
  app = app.replace(
    `campusbrief: CampusbriefPage,`,
    `campusbrief: CampusbriefPage,\n  agentfleet: AgentfleetPage,`,
  );
  console.log('App');
}
write('src/App.tsx', app);

let side = read('src/components/Sidebar.tsx');
if (!side.includes("'agentfleet'")) {
  side = side.replace(`'campusbrief',`, `'campusbrief',\n  'agentfleet',`);
}
if (!side.includes("id: 'agentfleet'")) {
  side = side.replace(
    `{ id: 'campusbrief', label: 'CEO Brif', description: 'Sabah nabız · aksiyon', icon: ClipboardList },`,
    `{ id: 'campusbrief', label: 'CEO Brif', description: 'Sabah nabız · aksiyon', icon: ClipboardList },
  { id: 'agentfleet', label: 'Ajan Filosu', description: '28 ajan · LİKYA-1 dağıt', icon: Bot },`,
  );
  console.log('Sidebar');
}
write('src/components/Sidebar.tsx', side);

let dom = read('src/nav/campusDomains.ts');
if (!dom.includes("'agentfleet'")) {
  dom = dom.replace(
    `pages: ['campusbrief', 'agentbridge', 'agentqueue', 'komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],`,
    `pages: ['campusbrief', 'agentfleet', 'agentbridge', 'agentqueue', 'komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],`,
  );
  write('src/nav/campusDomains.ts', dom);
  console.log('domains');
}

let oa = read('server/openapi.js');
if (!oa.includes("'/api/agentfleet'")) {
  oa = oa.replace(
    `'/api/campusbrief': { get: { summary: 'CEO kampüs brifi', tags: ['campusbrief'] } },`,
    `'/api/campusbrief': { get: { summary: 'CEO kampüs brifi', tags: ['campusbrief'] } },
      '/api/agentfleet': { get: { summary: '28 ajan filosu', tags: ['agentfleet'] } },`,
  );
  write('server/openapi.js', oa);
}

let ops = read('server/ops.js');
for (const c of ['agent-presence', 'agent-pings']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'green-incidents',`, `'green-incidents',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE6_WIRE_OK');
