#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ addCampusIncident, campusCapacityRollup, campusCoreOverview, resolveCampusIncident, transitionCampusZone, updateCampusZone \} from '\.\/campuscore\.js';/,
  `import {
  addCampusIncident,
  campusCapacityRollup,
  campusCoreOverview,
  completeCampusWorkOrder,
  createCampusWorkOrder,
  resolveCampusIncident,
  runCampusWorkOrderSweep,
  transitionCampusZone,
  updateCampusZone,
} from './campuscore.js';`,
);

const routes = `
        if (path === '/api/campus/work-order' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, createCampusWorkOrder(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/work-order/complete' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, completeCampusWorkOrder(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/work-order/sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runCampusWorkOrderSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/campus/work-order'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/campus\/capacity'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/campus/work-order'")) {
  oa = oa.replace(
    `'/api/campus/capacity': { post: { summary: 'Kampüs kapasite rollup', tags: ['campus'] } },`,
    `'/api/campus/capacity': { post: { summary: 'Kampüs kapasite rollup', tags: ['campus'] } },
      '/api/campus/work-order': { post: { summary: 'Kampüs iş emri aç', tags: ['campus'] } },
      '/api/campus/work-order/complete': { post: { summary: 'İş emri tamamla', tags: ['campus'] } },
      '/api/campus/work-order/sweep': { post: { summary: 'Incident → iş emri sweep', tags: ['campus'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['campus-work-orders', 'campus-work-order-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE34_WIRE_OK');
