#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  completeLifeFollowUp,
  createLifePlan,
  ingestWearable,
  ingestWearableWebhook,
  lifeCoachCheckIn,
  lifeCoachOverview,
  lifeWeeklyDigest,
  processLifeFlags,
  registerLifeDevice,
  scheduleLifeFollowUps,
  scoreLifePlanAdherence,
  verifyLifeWebhookSignature,
} from './lifecoach.js';`;

const newImport = `import {
  clearLifeCrisis,
  completeLifeFollowUp,
  createLifePlan,
  flagLifeCrisis,
  ingestWearable,
  ingestWearableWebhook,
  lifeCoachCheckIn,
  lifeCoachOverview,
  lifeWeeklyDigest,
  processLifeFlags,
  registerLifeDevice,
  runLifeMissedCheckInSweep,
  scheduleLifeFollowUps,
  scoreLifePlanAdherence,
  verifyLifeWebhookSignature,
} from './lifecoach.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('flagLifeCrisis')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/lifecoach/crisis' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, flagLifeCrisis(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/lifecoach/crisis/clear' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, clearLifeCrisis(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/lifecoach/checkin/missed-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runLifeMissedCheckInSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/lifecoach/crisis'")) {
  const anchor = `        if (path === '/api/lifecoach/adherence' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, scoreLifePlanAdherence(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/lifecoach/crisis'")) {
  const oaAnchor = `'/api/lifecoach/adherence': { post: { summary: 'Plan adherence skoru', tags: ['lifecoach'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/lifecoach/crisis': { post: { summary: 'Yaşam kriz bayrağı', tags: ['lifecoach'] } },
      '/api/lifecoach/crisis/clear': { post: { summary: 'Kriz kapat', tags: ['lifecoach'] } },
      '/api/lifecoach/checkin/missed-sweep': { post: { summary: 'Kaçırılan check-in SLA', tags: ['lifecoach'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['life-crises', 'life-crisis-clears', 'life-missed-checkins', 'life-missed-checkin-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'life-adherence',`, `'life-adherence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE51_WIRE_OK');
