#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  confirmCultureTicket,
  createCultureEvent,
  cultureBoxOfficeRollup,
  cultureSceneOverview,
  endCultureStream,
  expireCultureHolds,
  holdCultureTicket,
  pulseCultureStream,
  refundCultureSale,
  releaseCultureHold,
  setCultureLive,
  setCultureStageStatus,
  settleCultureEvent,
  startCultureStream,
} from './culturescene.js';`;

const newImport = `import {
  ackCultureCrewCall,
  callCultureCrew,
  confirmCultureTicket,
  createCultureEvent,
  cultureBoxOfficeRollup,
  cultureSceneOverview,
  endCultureStream,
  expireCultureHolds,
  holdCultureTicket,
  pulseCultureStream,
  refundCultureSale,
  releaseCultureHold,
  scanCultureDoor,
  setCultureLive,
  setCultureStageStatus,
  settleCultureEvent,
  startCultureStream,
} from './culturescene.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('scanCultureDoor')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/culture/door/scan' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, scanCultureDoor(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/crew/call' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, callCultureCrew(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/crew/ack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, ackCultureCrewCall(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/culture/door/scan'")) {
  const anchor = `        if (path === '/api/culture/event/settle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, settleCultureEvent(await readBody(req), user.username)); })();
          return;
        }
`;
  if (!platform.includes(anchor)) {
    console.error('ROUTE_ANCHOR_MISS');
    process.exit(1);
  }
  platform = platform.replace(anchor, `${anchor}${routes}`);
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/culture/door/scan'")) {
  const oaAnchor = `'/api/culture/event/settle': { post: { summary: 'Etkinlik closeout', tags: ['culturescene'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/culture/door/scan': { post: { summary: 'Kapı bilet tarama', tags: ['culturescene'] } },
      '/api/culture/crew/call': { post: { summary: 'Sahne crew call', tags: ['culturescene'] } },
      '/api/culture/crew/ack': { post: { summary: 'Crew call ack', tags: ['culturescene'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['culture-door-scans', 'culture-crew-calls']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'culture-sales',`, `'culture-sales',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE46_WIRE_OK');
