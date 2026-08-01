#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ agentQueueOverview, claimAgentJob, completeAgentJob, enqueueAgentJob, tickAgentQueue \} from '\.\/agentqueue\.js';/,
  `import { agentQueueOverview, claimAgentJob, completeAgentJob, enqueueAgentJob, runAgentQueueSlaSweep, tickAgentQueue } from './agentqueue.js';`,
);

platform = platform.replace(
  /import \{ campusBriefOverview, campusHealthCheck, runCampusAutomations \} from '\.\/campusbrief\.js';/,
  `import { ackCampusBriefAction, campusBriefOverview, campusHealthCheck, runCampusAutomations, syncCampusBriefActions } from './campusbrief.js';`,
);

const routes = `
        if (path === '/api/agentqueue/sla-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runAgentQueueSlaSweep(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campusbrief/actions' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, syncCampusBriefActions(user.username));
          return;
        }
        if (path === '/api/campusbrief/actions/ack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, ackCampusBriefAction(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/agentqueue/sla-sweep'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/agentqueue\/tick'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/agentqueue/sla-sweep'")) {
  oa = oa.replace(
    `'/api/greenpulse/automations': { post: { summary: 'ESG remediation playbook', tags: ['greenpulse'] } },`,
    `'/api/greenpulse/automations': { post: { summary: 'ESG remediation playbook', tags: ['greenpulse'] } },
      '/api/agentqueue/sla-sweep': { post: { summary: 'Ajan kuyruk SLA sweep', tags: ['agentqueue'] } },
      '/api/campusbrief/actions': { post: { summary: 'Brif aksiyon kayıt sync', tags: ['campusbrief'] } },
      '/api/campusbrief/actions/ack': { post: { summary: 'Brif aksiyon ack', tags: ['campusbrief'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
if (!ops.includes("'campus-brief-actions'")) {
  ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  'campus-brief-actions',`);
  console.log('ops campus-brief-actions');
}
write('server/ops.js', ops);

console.log('WAVE13_WIRE_OK');
