#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ bridgeRecoveryPlan, linkSportProfiles, runSportEligibilitySweep, sportBridgeOverview, syncSlotToSession \} from '\.\/sportbridge\.js';/,
  `import {
  bridgeRecoveryPlan,
  gateSportSlotAccess,
  linkSportProfiles,
  runSportEligibilitySweep,
  sportBridgeOverview,
  syncSlotToSession,
} from './sportbridge.js';`,
);

const routes = `
        if (path === '/api/sportbridge/gate' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, gateSportSlotAccess(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/sportbridge/gate'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/sportbridge\/eligibility'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/sportbridge/gate'")) {
  oa = oa.replace(
    `'/api/sportbridge/eligibility': { post: { summary: 'Spor eligibilite taraması', tags: ['sportbridge'] } },`,
    `'/api/sportbridge/eligibility': { post: { summary: 'Spor eligibilite taraması', tags: ['sportbridge'] } },
      '/api/sportbridge/gate': { post: { summary: 'Slot clearance/injury kapısı', tags: ['sportbridge'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
if (!ops.includes("'sport-gate-checks'")) {
  ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  'sport-gate-checks',`);
  console.log('ops sport-gate-checks');
}
write('server/ops.js', ops);

console.log('WAVE32_WIRE_OK');
