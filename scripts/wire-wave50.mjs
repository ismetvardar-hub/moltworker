#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  addGreenIncident,
  approveGreenWorkPermit,
  batchRecordGreenMeters,
  closeGreenWorkPermit,
  createGreenWorkPermit,
  greenPulseOverview,
  recordGreenMeter,
  runGreenPulseAutomations,
  runWaterLeakTriage,
} from './greenpulse.js';`;

const newImport = `import {
  addGreenIncident,
  approveGreenWorkPermit,
  batchRecordGreenMeters,
  clearGreenCurtailment,
  closeGreenWorkPermit,
  createGreenWorkPermit,
  greenPulseOverview,
  issueGreenCurtailment,
  recordGreenMeter,
  runGreenPermitExpirySweep,
  runGreenPulseAutomations,
  runWaterLeakTriage,
} from './greenpulse.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('runGreenPermitExpirySweep')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/greenpulse/permit/expiry-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runGreenPermitExpirySweep(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/curtailment' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, issueGreenCurtailment(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/curtailment/clear' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, clearGreenCurtailment(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/greenpulse/permit/expiry-sweep'")) {
  const anchor = `        if (path === '/api/greenpulse/water-triage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runWaterLeakTriage(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/greenpulse/permit/expiry-sweep'")) {
  const oaAnchor = `'/api/greenpulse/water-triage': { post: { summary: 'Su kaçağı triage', tags: ['greenpulse'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/greenpulse/permit/expiry-sweep': { post: { summary: 'İzin süre dolumu sweep', tags: ['greenpulse'] } },
      '/api/greenpulse/curtailment': { post: { summary: 'Enerji/su kısıtı', tags: ['greenpulse'] } },
      '/api/greenpulse/curtailment/clear': { post: { summary: 'Kısıt kaldır', tags: ['greenpulse'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of [
  'green-permit-expiry-sweeps',
  'green-curtailments',
  'green-curtailment-clears',
]) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'green-work-permits',`, `'green-work-permits',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE50_WIRE_OK');
