#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  addCampusIncident,
  campusCapacityRollup,
  campusCoreOverview,
  completeCampusWorkOrder,
  createCampusWorkOrder,
  resolveCampusIncident,
  runCampusWorkOrderSweep,
  transitionCampusZone,
  updateCampusZone,
} from './campuscore.js';`;

const newImport = `import {
  addCampusIncident,
  assignCampusWorkOrder,
  campusCapacityRollup,
  campusCoreOverview,
  completeCampusWorkOrder,
  createCampusWorkOrder,
  escalateCampusWorkOrder,
  resolveCampusIncident,
  runCampusWorkOrderSweep,
  startCampusWorkOrder,
  transitionCampusZone,
  updateCampusZone,
} from './campuscore.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('assignCampusWorkOrder')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/campus/work-order/assign' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, assignCampusWorkOrder(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/work-order/start' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, startCampusWorkOrder(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/work-order/escalate' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, escalateCampusWorkOrder(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/campus/work-order/assign'")) {
  const anchor = `        if (path === '/api/campus/work-order/sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runCampusWorkOrderSweep(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/campus/work-order/assign'")) {
  const oaAnchor = `'/api/campus/work-order/sweep': { post: { summary: 'Incident → iş emri sweep', tags: ['campus'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/campus/work-order/assign': { post: { summary: 'İş emri ata', tags: ['campus'] } },
      '/api/campus/work-order/start': { post: { summary: 'İş emri başlat', tags: ['campus'] } },
      '/api/campus/work-order/escalate': { post: { summary: 'İş emri escalate', tags: ['campus'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['campus-work-order-assignments', 'campus-work-order-escalations']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'campus-work-orders',`, `'campus-work-orders',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE40_WIRE_OK');
