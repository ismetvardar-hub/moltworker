#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ createMarketListing, marketCheckout, marketOsOverview, reconcileMarketChannels, restockMarketListing, returnMarketRental, syncMarketChannel \} from '\.\/marketos\.js';/,
  `import {
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
} from './marketos.js';`,
);

const routes = `
        if (path === '/api/marketos/low-stock' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runMarketLowStockSweep(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/po' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, createMarketPurchaseOrder(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/marketos/po/receive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, receiveMarketPurchaseOrder(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/marketos/low-stock'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/marketos\/reconcile'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/marketos/low-stock'")) {
  oa = oa.replace(
    `'/api/marketos/reconcile': { post: { summary: 'Kanal toplu sync', tags: ['marketos'] } },`,
    `'/api/marketos/reconcile': { post: { summary: 'Kanal toplu sync', tags: ['marketos'] } },
      '/api/marketos/low-stock': { post: { summary: 'Düşük stok taraması', tags: ['marketos'] } },
      '/api/marketos/po': { post: { summary: 'Satınalma emri (PO)', tags: ['marketos'] } },
      '/api/marketos/po/receive': { post: { summary: 'PO teslim / stok', tags: ['marketos'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['market-purchase-orders', 'market-low-stock-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE33_WIRE_OK');
