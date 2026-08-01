#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ agentQueueOverview, claimAgentJob, completeAgentJob, enqueueAgentJob, runAgentQueueSlaSweep, tickAgentQueue \} from '\.\/agentqueue\.js';/,
  `import {
  agentQueueOverview,
  archiveAgentJobs,
  claimAgentJob,
  completeAgentJob,
  enqueueAgentJob,
  rebalanceAgentQueue,
  reviveDeadAgentJobs,
  runAgentQueueSlaSweep,
  tickAgentQueue,
} from './agentqueue.js';`,
);

const routes = `
        if (path === '/api/agentqueue/rebalance' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, rebalanceAgentQueue(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentqueue/revive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, reviveDeadAgentJobs(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentqueue/archive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, archiveAgentJobs(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/agentqueue/rebalance'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/agentqueue\/sla-sweep'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/agentqueue/rebalance'")) {
  oa = oa.replace(
    `'/api/agentqueue/sla-sweep': { post: { summary: 'Ajan kuyruk SLA sweep', tags: ['agentqueue'] } },`,
    `'/api/agentqueue/sla-sweep': { post: { summary: 'Ajan kuyruk SLA sweep', tags: ['agentqueue'] } },
      '/api/agentqueue/rebalance': { post: { summary: 'Kuyruk öncelik dengele', tags: ['agentqueue'] } },
      '/api/agentqueue/revive': { post: { summary: 'Dead-letter yeniden kuyruk', tags: ['agentqueue'] } },
      '/api/agentqueue/archive': { post: { summary: 'Eski işleri arşivle', tags: ['agentqueue'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['agent-jobs-archive', 'agent-queue-rebalances', 'agent-queue-archives']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE35_WIRE_OK');
