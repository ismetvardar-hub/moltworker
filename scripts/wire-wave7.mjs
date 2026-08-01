#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ createBackup, healthCheck, listDataFiles, restoreBackup \} from '\.\/ops\.js';/,
  `import { createBackup, healthCheck, healthCheckAsync, listDataFiles, restoreBackup } from './ops.js';`,
);
platform = platform.replace(
  /import \{ createMarketListing, marketCheckout, marketOsOverview, syncMarketChannel \} from '\.\/marketos\.js';/,
  `import { createMarketListing, marketCheckout, marketOsOverview, returnMarketRental, syncMarketChannel } from './marketos.js';`,
);
platform = platform.replace(
  /import \{ openMallOverview, recordMallSale, updateMallTenant \} from '\.\/openmall\.js';/,
  `import { mallDayRollup, openMallOverview, recordMallSale, updateMallTenant } from './openmall.js';`,
);
platform = platform.replace(
  /import \{ familyCampOverview, familyCheckIn, familyCheckOut \} from '\.\/familycamp\.js';/,
  `import { bookFamilyProgram, familyCampOverview, familyCheckIn, familyCheckOut, familyEmergencyNote } from './familycamp.js';`,
);
platform = platform.replace(
  /import \{ createCultureEvent, cultureSceneOverview, holdCultureTicket, setCultureLive \} from '\.\/culturescene\.js';/,
  `import { confirmCultureTicket, createCultureEvent, cultureSceneOverview, holdCultureTicket, releaseCultureHold, setCultureLive } from './culturescene.js';`,
);
platform = platform.replace(
  /import \{ campusBriefOverview, runCampusAutomations \} from '\.\/campusbrief\.js';/,
  `import { campusBriefOverview, campusHealthCheck, runCampusAutomations } from './campusbrief.js';`,
);

// health endpoint async
platform = platform.replace(
  /sendJson\(res, 200, healthCheck\(\)\);/,
  `void healthCheckAsync().then((h) => sendJson(res, 200, h));`,
);

const routes = `
        if (path === '/api/familycamp/book' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, bookFamilyProgram(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/familycamp/emergency' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, familyEmergencyNote(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/confirm' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, confirmCultureTicket(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/release' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, releaseCultureHold(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/return' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, returnMarketRental(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/openmall/day-rollup' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, mallDayRollup(user.username));
          return;
        }
        if (path === '/api/campus/health' && req.method === 'GET') {
          const u = requireUser(req, res);
          if (!u) return;
          sendJson(res, 200, campusHealthCheck());
          return;
        }
`;

if (!platform.includes("/api/campus/health'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/agentfleet\/dispatch'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/campus/health'")) {
  oa = oa.replace(
    `'/api/agentfleet': { get: { summary: '28 ajan filosu', tags: ['agentfleet'] } },`,
    `'/api/agentfleet': { get: { summary: '28 ajan filosu', tags: ['agentfleet'] } },
      '/api/campus/health': { get: { summary: 'Kampüs sağlık skoru', tags: ['campus'] } },
      '/api/familycamp/book': { post: { summary: 'Aile program rezervasyon', tags: ['familycamp'] } },
      '/api/culture/confirm': { post: { summary: 'Bilet hold onay', tags: ['culturescene'] } },
      '/api/marketos/return': { post: { summary: 'Kiralama iade', tags: ['marketos'] } },
      '/api/openmall/day-rollup': { post: { summary: 'AVM günlük POS rollup', tags: ['openmall'] } },`,
  );
  write('server/openapi.js', oa);
}

let ops = read('server/ops.js');
for (const c of ['family-bookings', 'family-notes', 'culture-sales', 'market-returns', 'mall-day-rollups']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE7_WIRE_OK');
