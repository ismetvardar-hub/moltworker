#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  applyExtremeWeatherHold,
  cancelExtremeReservation,
  checkInExtremeReservation,
  clearExtremeWeatherHold,
  createExtremeMaas,
  expireExtremeWaitlist,
  extremeOverview,
  extremeSlotWeatherCheck,
  extremeUserSpec,
  extremeWalletSpend,
  issueExtremeGear,
  joinExtremeWaitlist,
  markExtremeNoShow,
  promoteExtremeWaitlist,
  reserveExtremeSlot,
  returnExtremeGear,
  runExtremeGearServiceSweep,
  signExtremeWaiver,
  updateExtremeGear,
} from './extremepark.js';`;

const newImport = `import {
  applyExtremeWeatherHold,
  cancelExtremeReservation,
  checkInExtremeReservation,
  clearExtremeWeatherHold,
  createExtremeMaas,
  expireExtremeWaitlist,
  extremeOverview,
  extremeSlotWeatherCheck,
  extremeUserSpec,
  extremeWalletSpend,
  issueExtremeGear,
  joinExtremeWaitlist,
  markExtremeNoShow,
  promoteExtremeWaitlist,
  renewExtremeMaas,
  reserveExtremeSlot,
  returnExtremeGear,
  runExtremeGearServiceSweep,
  runExtremeWeatherHoldSweep,
  signExtremeWaiver,
  topUpExtremeWallet,
  updateExtremeGear,
} from './extremepark.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('renewExtremeMaas')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/extreme/maas/renew' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, renewExtremeMaas(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/wallet/topup' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, topUpExtremeWallet(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/weather-hold/sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runExtremeWeatherHoldSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/extreme/maas/renew'")) {
  const anchor = `        if (path === '/api/extreme/wallet/spend' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, extremeWalletSpend(await readBody(req), user.username));
          })();
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
if (!oa.includes("'/api/extreme/maas/renew'")) {
  const oaAnchor = `'/api/extreme/wallet/spend': { post: { summary: 'NFC cüzdan harcama', tags: ['extremepark'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/extreme/maas/renew': { post: { summary: 'MaaS QR yenile', tags: ['extremepark'] } },
      '/api/extreme/wallet/topup': { post: { summary: 'NFC cüzdan yükle', tags: ['extremepark'] } },
      '/api/extreme/weather-hold/sweep': { post: { summary: 'Hava hold sweep', tags: ['extreme'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['extreme-maas-renewals', 'extreme-wallet-topups', 'extreme-weather-hold-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'extreme-maas',`, `'extreme-maas',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE53_WIRE_OK');
