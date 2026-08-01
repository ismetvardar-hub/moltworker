#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ agentFleetOverview, dispatchFleetDirective, pingFleetAgent, sweepFleetPresence \} from '\.\/agentfleet\.js';/,
  `import {
  acknowledgeFleetDirective,
  agentFleetOverview,
  dispatchFleetDirective,
  handoffFleetShift,
  pingFleetAgent,
  startFleetShift,
  sweepFleetPresence,
} from './agentfleet.js';`,
);

const routes = `
        if (path === '/api/agentfleet/directive/ack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, acknowledgeFleetDirective(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentfleet/shift/start' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, startFleetShift(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentfleet/shift/handoff' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, handoffFleetShift(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/agentfleet/shift/start'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/agentfleet\/presence-sweep'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/agentfleet/shift/start'")) {
  oa = oa.replace(
    `'/api/agentfleet/presence-sweep': { post: { summary: 'Filo presence sweep', tags: ['agentfleet'] } },`,
    `'/api/agentfleet/presence-sweep': { post: { summary: 'Filo presence sweep', tags: ['agentfleet'] } },
      '/api/agentfleet/directive/ack': { post: { summary: 'Filo direktif ack', tags: ['agentfleet'] } },
      '/api/agentfleet/shift/start': { post: { summary: 'Vardiya başlat', tags: ['agentfleet'] } },
      '/api/agentfleet/shift/handoff': { post: { summary: 'Vardiya handoff', tags: ['agentfleet'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['fleet-shifts', 'fleet-handoffs', 'fleet-directives']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE37_WIRE_OK');
