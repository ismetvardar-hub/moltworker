#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{\s*createLifePlan,\s*ingestWearable,\s*ingestWearableWebhook,\s*lifeCoachCheckIn,\s*lifeCoachOverview,\s*lifeWeeklyDigest,\s*processLifeFlags,\s*registerLifeDevice,\s*verifyLifeWebhookSignature,\s*\} from '\.\/lifecoach\.js';/,
  `import {
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
} from './lifecoach.js';`,
);

const routes = `
        if (path === '/api/lifecoach/followups/schedule' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, scheduleLifeFollowUps(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/lifecoach/followups/complete' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, completeLifeFollowUp(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/lifecoach/adherence' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, scoreLifePlanAdherence(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/lifecoach/followups/schedule'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/lifecoach\/digest'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/lifecoach/followups/schedule'")) {
  oa = oa.replace(
    `'/api/lifecoach/digest': { post: { summary: 'Haftalık yaşam digest', tags: ['lifecoach'] } },`,
    `'/api/lifecoach/digest': { post: { summary: 'Haftalık yaşam digest', tags: ['lifecoach'] } },
      '/api/lifecoach/followups/schedule': { post: { summary: 'Follow-up planla', tags: ['lifecoach'] } },
      '/api/lifecoach/followups/complete': { post: { summary: 'Follow-up tamamla', tags: ['lifecoach'] } },
      '/api/lifecoach/adherence': { post: { summary: 'Plan adherence skoru', tags: ['lifecoach'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['life-followups', 'life-adherence']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE31_WIRE_OK');
