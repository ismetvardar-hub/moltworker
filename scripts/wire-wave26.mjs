#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ mallDayRollup, openMallOverview, recordMallSale, settleMallTenantFnb, updateMallTenant \} from '\.\/openmall\.js';/,
  `import {
  generateMallRentRun,
  mallDayRollup,
  openMallOverview,
  payMallInvoice,
  recordMallSale,
  runMallDunningSweep,
  settleMallTenantFnb,
  updateMallTenant,
} from './openmall.js';`,
);

const routes = `
        if (path === '/api/openmall/rent-run' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, generateMallRentRun(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/openmall/invoice/pay' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, payMallInvoice(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/openmall/dunning' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runMallDunningSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/openmall/rent-run'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/openmall\/day-rollup'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/openmall/rent-run'")) {
  oa = oa.replace(
    `'/api/openmall/day-rollup': { post: { summary: 'AVM günlük POS rollup', tags: ['openmall'] } },`,
    `'/api/openmall/day-rollup': { post: { summary: 'AVM günlük POS rollup', tags: ['openmall'] } },
      '/api/openmall/rent-run': { post: { summary: 'Aylık kira faturası üret', tags: ['openmall'] } },
      '/api/openmall/invoice/pay': { post: { summary: 'Kira faturası tahsil', tags: ['openmall'] } },
      '/api/openmall/dunning': { post: { summary: 'Gecikmiş kira dunning', tags: ['openmall'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['mall-invoices', 'mall-payments', 'mall-dunning-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE26_WIRE_OK');
