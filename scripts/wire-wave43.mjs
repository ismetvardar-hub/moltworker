#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  generateMallRentRun,
  mallDayRollup,
  openMallOverview,
  payMallInvoice,
  recordMallSale,
  runMallDunningSweep,
  settleMallTenantFnb,
  updateMallTenant,
} from './openmall.js';`;

const newImport = `import {
  generateMallCamRun,
  generateMallRentRun,
  holdMallLease,
  mallDayRollup,
  openMallOverview,
  payMallInvoice,
  recordMallSale,
  releaseMallLease,
  runMallDunningSweep,
  settleMallTenantFnb,
  updateMallTenant,
} from './openmall.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('generateMallCamRun')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/openmall/cam-run' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, generateMallCamRun(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/openmall/lease/hold' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, holdMallLease(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/openmall/lease/release' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, releaseMallLease(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/openmall/cam-run'")) {
  const anchor = `        if (path === '/api/openmall/dunning' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runMallDunningSweep(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/openmall/cam-run'")) {
  const oaAnchor = `'/api/openmall/dunning': { post: { summary: 'Gecikmiş kira dunning', tags: ['openmall'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/openmall/cam-run': { post: { summary: 'CAM ortak alan faturası', tags: ['openmall'] } },
      '/api/openmall/lease/hold': { post: { summary: 'Kiracı lease hold', tags: ['openmall'] } },
      '/api/openmall/lease/release': { post: { summary: 'Lease hold kaldır', tags: ['openmall'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['mall-cam-runs', 'mall-lease-holds']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'mall-invoices',`, `'mall-invoices',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE43_WIRE_OK');
