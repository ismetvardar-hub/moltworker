#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  agentBridgeBroadcast,
  agentBridgeOverview,
  agentBridgePing,
  escalateAgentBridgeAlert,
  openAgentBridgeChannel,
  pulseAgentBridgeChannel,
  resolveAgentBridgeAlert,
} from './agentbridge.js';`;

const newImport = `import {
  agentBridgeBroadcast,
  agentBridgeOverview,
  agentBridgePing,
  closeAgentBridgeChannel,
  escalateAgentBridgeAlert,
  openAgentBridgeChannel,
  pulseAgentBridgeChannel,
  resolveAgentBridgeAlert,
  routeAgentBridgeAlert,
  runAgentBridgeAlertSlaSweep,
} from './agentbridge.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('closeAgentBridgeChannel')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/agentbridge/channel/close' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, closeAgentBridgeChannel(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentbridge/alert/sla-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runAgentBridgeAlertSlaSweep(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentbridge/alert/route' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, routeAgentBridgeAlert(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/agentbridge/channel/close'")) {
  const anchor = `        if (path === '/api/agentbridge/alert/resolve' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, resolveAgentBridgeAlert(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/agentbridge/channel/close'")) {
  const oaAnchor = `'/api/agentbridge/alert/resolve': { post: { summary: 'Köprü alert kapat', tags: ['agentbridge'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/agentbridge/channel/close': { post: { summary: 'Köprü kanal kapat', tags: ['agentbridge'] } },
      '/api/agentbridge/alert/sla-sweep': { post: { summary: 'Alert SLA sweep', tags: ['agentbridge'] } },
      '/api/agentbridge/alert/route': { post: { summary: 'Alert → WO/fleet route', tags: ['agentbridge'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['agent-bridge-alert-routes', 'agent-bridge-sla-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-bridge-alerts',`, `'agent-bridge-alerts',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE42_WIRE_OK');
