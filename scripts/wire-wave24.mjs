#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{\s*applyExtremeWeatherHold,\s*cancelExtremeReservation,\s*clearExtremeWeatherHold,\s*createExtremeMaas,\s*extremeOverview,\s*extremeSlotWeatherCheck,\s*extremeUserSpec,\s*extremeWalletSpend,\s*joinExtremeWaitlist,\s*promoteExtremeWaitlist,\s*reserveExtremeSlot,\s*returnExtremeGear,\s*signExtremeWaiver,\s*updateExtremeGear,\s*\} from '\.\/extremepark\.js';/,
  `import {
  applyExtremeWeatherHold,
  cancelExtremeReservation,
  clearExtremeWeatherHold,
  createExtremeMaas,
  extremeOverview,
  extremeSlotWeatherCheck,
  extremeUserSpec,
  extremeWalletSpend,
  issueExtremeGear,
  joinExtremeWaitlist,
  promoteExtremeWaitlist,
  reserveExtremeSlot,
  returnExtremeGear,
  runExtremeGearServiceSweep,
  signExtremeWaiver,
  updateExtremeGear,
} from './extremepark.js';`,
);

const routes = `
        if (path === '/api/extreme/gear-issue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, issueExtremeGear(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/gear-service-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runExtremeGearServiceSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/extreme/gear-issue'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/extreme\/gear-return'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/extreme/gear-issue'")) {
  oa = oa.replace(
    `'/api/extreme/gear-return': { post: { summary: 'Ekipman iade', tags: ['extreme'] } },`,
    `'/api/extreme/gear-return': { post: { summary: 'Ekipman iade', tags: ['extreme'] } },
      '/api/extreme/gear-issue': { post: { summary: 'Ekipman checkout', tags: ['extreme'] } },
      '/api/extreme/gear-service-sweep': { post: { summary: 'Ekipman servis taraması', tags: ['extreme'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['extreme-gear-ledger', 'extreme-gear-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE24_WIRE_OK');
