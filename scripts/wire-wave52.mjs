#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
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

const newImport = `import {
  addCampusIncident,
  assignCampusWorkOrder,
  campusCapacityRollup,
  campusCoreOverview,
  clearCampusZoneLockdown,
  completeCampusWorkOrder,
  createCampusWorkOrder,
  escalateCampusIncident,
  escalateCampusWorkOrder,
  lockdownCampusZone,
  resolveCampusIncident,
  runCampusCapacityAlertSweep,
  runCampusWorkOrderSweep,
  startCampusWorkOrder,
  transitionCampusZone,
  updateCampusZone,
} from './campuscore.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('escalateCampusIncident')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/campus/incident/escalate' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, escalateCampusIncident(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/zone/lockdown' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, lockdownCampusZone(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/zone/lockdown/clear' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, clearCampusZoneLockdown(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campus/capacity/alert-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runCampusCapacityAlertSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/campus/incident/escalate'")) {
  const anchor = `        if (path === '/api/campus/work-order/escalate' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, escalateCampusWorkOrder(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/campus/incident/escalate'")) {
  const oaAnchor = `'/api/campus/work-order/escalate': { post: { summary: 'İş emri escalate', tags: ['campus'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/campus/incident/escalate': { post: { summary: 'Incident escalate', tags: ['campus'] } },
      '/api/campus/zone/lockdown': { post: { summary: 'Zon lockdown', tags: ['campus'] } },
      '/api/campus/zone/lockdown/clear': { post: { summary: 'Lockdown kaldır', tags: ['campus'] } },
      '/api/campus/capacity/alert-sweep': { post: { summary: 'Kapasite alert sweep', tags: ['campus'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of [
  'campus-incident-escalations',
  'campus-zone-lockdowns',
  'campus-zone-lockdown-clears',
  'campus-capacity-alerts',
  'campus-capacity-alert-sweeps',
]) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'campus-capacity-rollups',`, `'campus-capacity-rollups',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE52_WIRE_OK');
