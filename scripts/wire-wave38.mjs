#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ agentBridgeBroadcast, agentBridgeOverview, agentBridgePing \} from '\.\/agentbridge\.js';/,
  `import {
  agentBridgeBroadcast,
  agentBridgeOverview,
  agentBridgePing,
  escalateAgentBridgeAlert,
  openAgentBridgeChannel,
  pulseAgentBridgeChannel,
  resolveAgentBridgeAlert,
} from './agentbridge.js';`,
);

const routes = `
        if (path === '/api/agentbridge/channel' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, openAgentBridgeChannel(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentbridge/channel/pulse' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, pulseAgentBridgeChannel(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentbridge/alert' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, escalateAgentBridgeAlert(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/agentbridge/alert/resolve' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, resolveAgentBridgeAlert(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/agentbridge/channel'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/agentbridge\/broadcast'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/agentbridge/channel'")) {
  oa = oa.replace(
    `'/api/agentbridge/broadcast': { post: { summary: 'Köprü broadcast', tags: ['agentbridge'] } },`,
    `'/api/agentbridge/broadcast': { post: { summary: 'Köprü broadcast', tags: ['agentbridge'] } },
      '/api/agentbridge/channel': { post: { summary: 'Köprü kanal aç', tags: ['agentbridge'] } },
      '/api/agentbridge/channel/pulse': { post: { summary: 'Kanal nabız', tags: ['agentbridge'] } },
      '/api/agentbridge/alert': { post: { summary: 'Köprü alert escalate', tags: ['agentbridge'] } },
      '/api/agentbridge/alert/resolve': { post: { summary: 'Köprü alert kapat', tags: ['agentbridge'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['agent-bridge-channels', 'agent-bridge-alerts']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE38_WIRE_OK');
