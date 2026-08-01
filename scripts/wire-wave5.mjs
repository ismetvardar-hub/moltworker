#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');
if (!platform.includes("from './campusbrief.js'")) {
  platform = platform.replace(
    /import \{ addGreenIncident, greenPulseOverview, recordGreenMeter \} from '\.\/greenpulse\.js';/,
    `import { addGreenIncident, greenPulseOverview, recordGreenMeter } from './greenpulse.js';
import { campusBriefOverview, runCampusAutomations } from './campusbrief.js';`,
  );
}

const routes = `
        if (path === '/api/campusbrief' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, campusBriefOverview(req.user?.username || 'ceo'));
          return;
        }
        if (path === '/api/campusbrief/auto' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, { ...runCampusAutomations(user.username), brief: campusBriefOverview(user.username) });
          return;
        }
`;

if (!platform.includes("/api/campusbrief'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/greenpulse\/incident'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('platform routes');
}
write('server/platform.js', platform);

// Fix campusbrief GET — requireUser doesn't set req.user typically; use user from requireUser
platform = read('server/platform.js');
platform = platform.replace(
  `sendJson(res, 200, campusBriefOverview(req.user?.username || 'ceo'));`,
  `const u = requireUser(req, res);\n          if (!u) return;\n          sendJson(res, 200, campusBriefOverview(u.username));`,
);
// That might double requireUser - fix properly
platform = platform.replace(
  `if (path === '/api/campusbrief' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const u = requireUser(req, res);
          if (!u) return;
          sendJson(res, 200, campusBriefOverview(u.username));
          return;
        }`,
  `if (path === '/api/campusbrief' && req.method === 'GET') {
          const u = requireUser(req, res);
          if (!u) return;
          sendJson(res, 200, campusBriefOverview(u.username));
          return;
        }`,
);
write('server/platform.js', platform);

for (const [file, id, indent] of [
  ['server/auth.js', 'campusbrief', '    '],
  ['server/brands.js', 'campusbrief', '      '],
]) {
  let s = read(file);
  if (!s.includes(`'${id}'`)) {
    s = s.replace(`'greenpulse',`, `'greenpulse',\n${indent}'${id}',`);
    write(file, s);
    console.log(file);
  }
}

let types = read('src/types.ts');
if (!types.includes("| 'campusbrief'")) {
  types = types.replace(`| 'greenpulse'`, `| 'greenpulse'\n  | 'campusbrief'`);
  write('src/types.ts', types);
  console.log('types');
}

let app = read('src/App.tsx');
if (!app.includes('const CampusbriefPage')) {
  app = app.replace(
    /(const GreenpulsePage = lazy\(\(\) => import\('\.\/pages\/GreenpulsePage'\)\);)/,
    `$1\nconst CampusbriefPage = lazy(() => import('./pages/CampusbriefPage'));`,
  );
}
if (!app.includes('campusbrief:')) {
  app = app.replace(
    `greenpulse: GreenpulsePage,`,
    `greenpulse: GreenpulsePage,\n  campusbrief: CampusbriefPage,`,
  );
  console.log('App');
}
write('src/App.tsx', app);

let side = read('src/components/Sidebar.tsx');
if (!side.includes("'campusbrief'")) {
  side = side.replace(`'greenpulse',`, `'greenpulse',\n  'campusbrief',`);
}
if (!side.includes("id: 'campusbrief'")) {
  side = side.replace(
    `{ id: 'greenpulse', label: 'Yeşil ESG', description: 'Orman · su · enerji · karbon', icon: Trees },`,
    `{ id: 'greenpulse', label: 'Yeşil ESG', description: 'Orman · su · enerji · karbon', icon: Trees },
  { id: 'campusbrief', label: 'CEO Brif', description: 'Sabah nabız · aksiyon', icon: ClipboardList },`,
  );
  console.log('Sidebar');
}
write('src/components/Sidebar.tsx', side);

// ClipboardList import?
let side2 = read('src/components/Sidebar.tsx');
if (side2.includes('ClipboardList') && !/ClipboardList,/.test(side2.split('from \'lucide-react\'')[0])) {
  side2 = side2.replace(/LayoutGrid,/, 'LayoutGrid,\n  ClipboardList,');
  write('src/components/Sidebar.tsx', side2);
  console.log('icon');
}

let dom = read('src/nav/campusDomains.ts');
if (!dom.includes("'campusbrief'")) {
  dom = dom.replace(
    `export const CORE_NAV_IDS = [
  'komuta',
  'campus',
  'brief',
  'hub',
  'extremepark',
  'notifications',
  'ops',
  'settings',
] as const`,
    `export const CORE_NAV_IDS = [
  'komuta',
  'campusbrief',
  'campus',
  'brief',
  'hub',
  'extremepark',
  'notifications',
  'ops',
  'settings',
] as const`,
  );
  dom = dom.replace(
    `pages: ['agentbridge', 'agentqueue', 'komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],`,
    `pages: ['campusbrief', 'agentbridge', 'agentqueue', 'komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],`,
  );
  write('src/nav/campusDomains.ts', dom);
  console.log('domains');
}

let oa = read('server/openapi.js');
if (!oa.includes("'/api/campusbrief'")) {
  oa = oa.replace(
    `'/api/greenpulse': { get: { summary: 'Yeşil ESG nabız', tags: ['greenpulse'] } },`,
    `'/api/greenpulse': { get: { summary: 'Yeşil ESG nabız', tags: ['greenpulse'] } },
      '/api/campusbrief': { get: { summary: 'CEO kampüs brifi', tags: ['campusbrief'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

console.log('WAVE5_WIRE_OK');
