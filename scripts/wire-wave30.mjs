#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ addGreenIncident, batchRecordGreenMeters, greenPulseOverview, recordGreenMeter, runGreenPulseAutomations \} from '\.\/greenpulse\.js';/,
  `import {
  addGreenIncident,
  approveGreenWorkPermit,
  batchRecordGreenMeters,
  closeGreenWorkPermit,
  createGreenWorkPermit,
  greenPulseOverview,
  recordGreenMeter,
  runGreenPulseAutomations,
  runWaterLeakTriage,
} from './greenpulse.js';`,
);

const routes = `
        if (path === '/api/greenpulse/permit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, createGreenWorkPermit(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/permit/approve' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, approveGreenWorkPermit(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/permit/close' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, closeGreenWorkPermit(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/water-triage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runWaterLeakTriage(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/greenpulse/permit'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/greenpulse\/automations'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/greenpulse/permit'")) {
  oa = oa.replace(
    `'/api/greenpulse/automations': { post: { summary: 'ESG remediation playbook', tags: ['greenpulse'] } },`,
    `'/api/greenpulse/automations': { post: { summary: 'ESG remediation playbook', tags: ['greenpulse'] } },
      '/api/greenpulse/permit': { post: { summary: 'Yeşil çalışma izni', tags: ['greenpulse'] } },
      '/api/greenpulse/permit/approve': { post: { summary: 'Çalışma izni onay/red', tags: ['greenpulse'] } },
      '/api/greenpulse/permit/close': { post: { summary: 'Çalışma izni kapat', tags: ['greenpulse'] } },
      '/api/greenpulse/water-triage': { post: { summary: 'Su kaçağı triage', tags: ['greenpulse'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['green-work-permits', 'green-water-triage']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE30_WIRE_OK');
