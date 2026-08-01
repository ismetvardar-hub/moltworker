#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{\s*confirmCultureTicket,\s*createCultureEvent,\s*cultureBoxOfficeRollup,\s*cultureSceneOverview,\s*endCultureStream,\s*holdCultureTicket,\s*pulseCultureStream,\s*releaseCultureHold,\s*setCultureLive,\s*setCultureStageStatus,\s*startCultureStream,\s*\} from '\.\/culturescene\.js';/,
  `import {
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
} from './culturescene.js';`,
);

const routes = `
        if (path === '/api/culture/holds/expire' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, expireCultureHolds(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/refund' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, refundCultureSale(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/event/settle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, settleCultureEvent(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/culture/holds/expire'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/culture\/box-office'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/culture/holds/expire'")) {
  oa = oa.replace(
    `'/api/culture/box-office': { post: { summary: 'Gişe günlük rollup', tags: ['culturescene'] } },`,
    `'/api/culture/box-office': { post: { summary: 'Gişe günlük rollup', tags: ['culturescene'] } },
      '/api/culture/holds/expire': { post: { summary: 'Bayat hold temizle', tags: ['culturescene'] } },
      '/api/culture/refund': { post: { summary: 'Bilet iadesi', tags: ['culturescene'] } },
      '/api/culture/event/settle': { post: { summary: 'Etkinlik closeout', tags: ['culturescene'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['culture-hold-expiries', 'culture-refunds', 'culture-settlements']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE28_WIRE_OK');
