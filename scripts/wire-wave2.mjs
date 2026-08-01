#!/usr/bin/env node
/**
 * Wave-2 wire: culturescene + sportbridge + stay/market/mall deepened routes.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function write(rel, s) {
  fs.writeFileSync(path.join(root, rel), s);
}
function once(hay, needle, insert, label) {
  if (hay.includes(needle.trim())) {
    console.log(`skip ${label}`);
    return hay;
  }
  if (!hay.includes(insert.anchor)) throw new Error(`anchor missing for ${label}: ${insert.anchor.slice(0, 60)}`);
  console.log(`wire ${label}`);
  return hay.replace(insert.anchor, `${insert.before ?? ''}${insert.anchor}${insert.after ?? ''}`);
}

// ── platform.js imports ──
let platform = read('server/platform.js');
platform = platform.replace(
  /import \{ createStayBooking, stayRingOverview, updateStayUnit \} from '\.\/stayring\.js';/,
  `import {
  checkoutStay,
  createStayBooking,
  createStayHkTask,
  issueStayKeyless,
  setStayWintering,
  stayRingOverview,
  updateStayUnit,
} from './stayring.js';`,
);
platform = platform.replace(
  /import \{ createMarketListing, marketCheckout, marketOsOverview \} from '\.\/marketos\.js';/,
  `import { createMarketListing, marketCheckout, marketOsOverview, syncMarketChannel } from './marketos.js';`,
);
if (!platform.includes("from './culturescene.js'")) {
  platform = platform.replace(
    /import \{ agentBridgeOverview, agentBridgePing \} from '\.\/agentbridge\.js';/,
    `import { agentBridgeOverview, agentBridgePing } from './agentbridge.js';
import { createCultureEvent, cultureSceneOverview, holdCultureTicket, setCultureLive } from './culturescene.js';
import { bridgeRecoveryPlan, linkSportProfiles, sportBridgeOverview, syncSlotToSession } from './sportbridge.js';`,
  );
}

const routeBlock = `
        if (path === '/api/stayring/keyless' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, issueStayKeyless(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/winter' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, setStayWintering(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/hk' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, createStayHkTask(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/checkout' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, checkoutStay(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/channel' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, syncMarketChannel(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, cultureSceneOverview());
          return;
        }
        if (path === '/api/culture/event' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, createCultureEvent(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/hold' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, holdCultureTicket(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/live' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, setCultureLive(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/sportbridge' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, sportBridgeOverview());
          return;
        }
        if (path === '/api/sportbridge/link' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, linkSportProfiles(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/sportbridge/sync-slot' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, syncSlotToSession(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/sportbridge/recovery' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, bridgeRecoveryPlan(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/culture'") && !platform.includes("/api/culture\"")) {
  // insert before Extreme Park block
  const anchor = "        // ── Antalya Extreme Park";
  if (!platform.includes(anchor)) throw new Error('extreme park anchor missing');
  platform = platform.replace(anchor, `${routeBlock}\n${anchor}`);
  console.log('wire platform routes');
} else {
  console.log('skip platform routes');
}
write('server/platform.js', platform);

// ── auth.js ──
let auth = read('server/auth.js');
for (const id of ['culturescene', 'sportbridge']) {
  if (!auth.includes(`'${id}'`)) {
    auth = auth.replace(`'agentbridge',`, `'agentbridge',\n    '${id}',`);
    console.log(`wire auth ${id}`);
  }
}
write('server/auth.js', auth);

// ── brands.js ──
let brands = read('server/brands.js');
for (const id of ['culturescene', 'sportbridge']) {
  if (!brands.includes(`'${id}'`)) {
    brands = brands.replace(`'agentbridge',`, `'agentbridge',\n      '${id}',`);
    console.log(`wire brands ${id}`);
  }
}
write('server/brands.js', brands);

// ── types.ts ──
let types = read('src/types.ts');
for (const id of ['culturescene', 'sportbridge']) {
  if (!types.includes(`| '${id}'`)) {
    types = types.replace(`| 'agentbridge'`, `| 'agentbridge'\n  | '${id}'`);
    console.log(`wire types ${id}`);
  }
}
write('src/types.ts', types);

// ── App.tsx ──
let app = read('src/App.tsx');
if (!app.includes("lazy(() => import('./pages/CulturescenePage'))")) {
  app = app.replace(
    `const AgentbridgePage = lazy(() => import('./pages/AgentbridgePage'));`,
    `const AgentbridgePage = lazy(() => import('./pages/AgentbridgePage'));
const CulturescenePage = lazy(() => import('./pages/CulturescenePage'));
const SportbridgePage = lazy(() => import('./pages/SportbridgePage'));`,
  );
}
if (!app.includes('culturescene: CulturescenePage')) {
  app = app.replace(
    `agentbridge: AgentbridgePage,`,
    `agentbridge: AgentbridgePage,\n  culturescene: CulturescenePage,\n  sportbridge: SportbridgePage,`,
  );
  console.log('wire App pages');
}
write('src/App.tsx', app);

// ── Sidebar ──
let side = read('src/components/Sidebar.tsx');
for (const id of ['culturescene', 'sportbridge']) {
  if (!side.includes(`'${id}'`)) {
    side = side.replace(`'campuscore',`, `'campuscore',\n  '${id}',`);
  }
}
if (!side.includes("id: 'culturescene'")) {
  side = side.replace(
    `{ id: 'agentbridge', label: 'Ajan Komuta', description: 'Filo nabız paneli', icon: Bot },`,
    `{ id: 'agentbridge', label: 'Ajan Komuta', description: 'Filo nabız paneli', icon: Bot },
  { id: 'culturescene', label: 'Kültür & Sahne', description: 'Etkinlik · bilet · live', icon: Music },
  { id: 'sportbridge', label: 'Spor Köprüsü', description: 'Park ↔ kulüp', icon: Trophy },`,
  );
  console.log('wire Sidebar NAV');
}
write('src/components/Sidebar.tsx', side);

// ── campusDomains ──
let dom = read('src/nav/campusDomains.ts');
dom = dom.replace(
  `primary: 'studio',
    pages: ['studio', 'aurora', 'livecast', 'mediawall', 'music'],`,
  `primary: 'culturescene',
    pages: ['culturescene', 'studio', 'aurora', 'livecast', 'mediawall', 'music'],`,
);
dom = dom.replace(
  `pages: ['extremepark', 'sportslot', 'arenabook', 'nexusgate', 'rentgear', 'tourpack'],`,
  `pages: ['extremepark', 'sportbridge', 'athleteos', 'sportslot', 'arenabook', 'nexusgate', 'rentgear', 'tourpack'],`,
);
write('src/nav/campusDomains.ts', dom);
console.log('wire campusDomains');

// ── openapi ──
let oa = read('server/openapi.js');
if (!oa.includes("'/api/culture'")) {
  oa = oa.replace(
    `'/api/agentbridge': { get: { summary: 'Ajan komuta', tags: ['agentbridge'] } },`,
    `'/api/agentbridge': { get: { summary: 'Ajan komuta', tags: ['agentbridge'] } },
      '/api/culture': { get: { summary: 'Kültür & Sahne', tags: ['culturescene'] } },
      '/api/sportbridge': { get: { summary: 'Spor köprüsü', tags: ['sportbridge'] } },`,
  );
  console.log('wire openapi');
}
write('server/openapi.js', oa);

// ── ops collections ──
let ops = read('server/ops.js');
const cols = [
  'stay-keys',
  'stay-hk',
  'culture-stages',
  'culture-events',
  'culture-holds',
  'sport-links',
  'sport-syncs',
  'market-channel-syncs',
];
for (const c of cols) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'extreme-notices',`, `'extreme-notices',\n  '${c}',`);
    console.log(`wire ops ${c}`);
  }
}
write('server/ops.js', ops);

console.log('WAVE2_WIRE_OK');
