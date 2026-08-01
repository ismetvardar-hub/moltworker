#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  bridgeRecoveryPlan,
  gateSportSlotAccess,
  linkSportProfiles,
  runSportEligibilitySweep,
  sportBridgeOverview,
  syncSlotToSession,
} from './sportbridge.js';`;

const newImport = `import {
  applySportCompetitionHold,
  bridgeRecoveryPlan,
  completeBridgeRecovery,
  gateSportSlotAccess,
  linkSportProfiles,
  runSportEligibilitySweep,
  runSportPostCompSweep,
  sportBridgeOverview,
  syncSlotToSession,
} from './sportbridge.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('applySportCompetitionHold')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/sportbridge/comp-hold' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, applySportCompetitionHold(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/sportbridge/recovery/complete' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, completeBridgeRecovery(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/sportbridge/postcomp-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runSportPostCompSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/sportbridge/comp-hold'")) {
  const anchor = `        if (path === '/api/sportbridge/gate' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, gateSportSlotAccess(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/sportbridge/comp-hold'")) {
  const oaAnchor = `'/api/sportbridge/gate': { post: { summary: 'Slot clearance/injury kapısı', tags: ['sportbridge'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/sportbridge/comp-hold': { post: { summary: 'Yarışma sonrası hold', tags: ['sportbridge'] } },
      '/api/sportbridge/recovery/complete': { post: { summary: 'Recovery closeout', tags: ['sportbridge'] } },
      '/api/sportbridge/postcomp-sweep': { post: { summary: 'Post-comp hold sweep', tags: ['sportbridge'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['sport-comp-holds', 'sport-recovery-closeouts', 'sport-postcomp-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'sport-gate-checks',`, `'sport-gate-checks',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE48_WIRE_OK');
