#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{\s*athleteOsOverview, logAthleteSession, upsertAthletePlan\s*\} from '\.\/athleteos\.js';/,
  `import { athleteOsOverview, athleteReadinessRollup, issueAthleteLicense, logAthleteSession, upsertAthletePlan } from './athleteos.js';`,
);
platform = platform.replace(
  /import \{\s*createLifePlan,\s*ingestWearable,\s*ingestWearableWebhook,\s*lifeCoachOverview,\s*processLifeFlags,\s*registerLifeDevice,\s*verifyLifeWebhookSignature,\s*\} from '\.\/lifecoach\.js';/,
  `import {
  createLifePlan,
  ingestWearable,
  ingestWearableWebhook,
  lifeCoachCheckIn,
  lifeCoachOverview,
  processLifeFlags,
  registerLifeDevice,
  verifyLifeWebhookSignature,
} from './lifecoach.js';`,
);
platform = platform.replace(
  /import \{\s*checkoutStay,\s*createStayBooking,\s*createStayHkTask,\s*issueStayKeyless,\s*setStayWintering,\s*stayRingOverview,\s*updateStayUnit,\s*\} from '\.\/stayring\.js';/,
  `import {
  checkoutStay,
  completeStayHk,
  createStayBooking,
  createStayHkTask,
  issueStayKeyless,
  setStayWintering,
  stayNightRollup,
  stayRingOverview,
  updateStayUnit,
} from './stayring.js';`,
);

const routes = `
        if (path === '/api/athleteos/license' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, issueAthleteLicense(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/athleteos/readiness' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, athleteReadinessRollup());
          return;
        }
        if (path === '/api/lifecoach/checkin' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, lifeCoachCheckIn(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/hk-complete' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, completeStayHk(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/night-rollup' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, stayNightRollup(user.username));
          return;
        }
`;

if (!platform.includes("/api/athleteos/license'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/athleteos\/session'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/athleteos/license'")) {
  oa = oa.replace(
    `'/api/campus/health': { get: { summary: 'Kampüs sağlık skoru', tags: ['campus'] } },`,
    `'/api/campus/health': { get: { summary: 'Kampüs sağlık skoru', tags: ['campus'] } },
      '/api/athleteos/license': { post: { summary: 'Sporcu lisans ver/yenile', tags: ['athleteos'] } },
      '/api/athleteos/readiness': { get: { summary: 'Sporcu readiness rollup', tags: ['athleteos'] } },
      '/api/lifecoach/checkin': { post: { summary: 'Yaşam uzmanı check-in', tags: ['lifecoach'] } },
      '/api/stayring/hk-complete': { post: { summary: 'HK görevi tamamla', tags: ['stayring'] } },
      '/api/stayring/night-rollup': { post: { summary: 'Gece doluluk/RevPAR', tags: ['stayring'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['athlete-sessions', 'life-checkins', 'stay-night-rollups']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE11_WIRE_OK');
