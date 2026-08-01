#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  createMarketListing,
  createMarketPurchaseOrder,
  marketCheckout,
  marketOsOverview,
  receiveMarketPurchaseOrder,
  reconcileMarketChannels,
  restockMarketListing,
  returnMarketRental,
  runMarketLowStockSweep,
  syncMarketChannel,
} from './marketos.js';`;

const newImport = `import {
  assessMarketRentalDamage,
  createMarketListing,
  createMarketPurchaseOrder,
  flagMarketRentalOverdue,
  marketCheckout,
  marketOsOverview,
  receiveMarketPurchaseOrder,
  reconcileMarketChannels,
  restockMarketListing,
  returnMarketRental,
  runMarketLowStockSweep,
  runMarketRentalSweep,
  settleMarketDeposit,
  syncMarketChannel,
} from './marketos.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('flagMarketRentalOverdue')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/marketos/rental/overdue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, flagMarketRentalOverdue(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/rental/damage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, assessMarketRentalDamage(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/deposit/settle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, settleMarketDeposit(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/rental/sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runMarketRentalSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/marketos/rental/overdue'")) {
  const anchor = `        if (path === '/api/marketos/po/receive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, receiveMarketPurchaseOrder(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/marketos/rental/overdue'")) {
  const oaAnchor = `'/api/marketos/po/receive': { post: { summary: 'PO teslim / stok', tags: ['marketos'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/marketos/rental/overdue': { post: { summary: 'Kiralama gecikme flag', tags: ['marketos'] } },
      '/api/marketos/rental/damage': { post: { summary: 'Hasar değerlendirmesi', tags: ['marketos'] } },
      '/api/marketos/deposit/settle': { post: { summary: 'Depozito kapanışı', tags: ['marketos'] } },
      '/api/marketos/rental/sweep': { post: { summary: 'Kiralama overdue sweep', tags: ['marketos'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of [
  'market-rental-overdues',
  'market-damage-assessments',
  'market-deposit-settlements',
  'market-rental-sweeps',
]) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'market-returns',`, `'market-returns',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE49_WIRE_OK');
