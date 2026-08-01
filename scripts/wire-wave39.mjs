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
  clearExtremeWeatherHold,
  createExtremeMaas,
  extremeOverview,
  extremeSlotWeatherCheck,
  extremeUserSpec,
  extremeWalletSpend,
  issueExtremeGear,
  joinExtremeWaitlist,
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
  reserveExtremeSlot,
  returnExtremeGear,
  runExtremeGearServiceSweep,
  signExtremeWaiver,
  updateExtremeGear,
} from './extremepark.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('checkInExtremeReservation')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/extreme/reservation/check-in' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, checkInExtremeReservation(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/reservation/no-show' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, markExtremeNoShow(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/waitlist/expire' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, expireExtremeWaitlist(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/extreme/reservation/check-in'")) {
  const anchor = `        if (path === '/api/extreme/waitlist/promote' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, promoteExtremeWaitlist(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/extreme/reservation/check-in'")) {
  const oaAnchor = `'/api/extreme/waitlist/promote': { post: { summary: 'Waitlist promote', tags: ['extreme'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/extreme/reservation/check-in': { post: { summary: 'Rezervasyon check-in', tags: ['extreme'] } },
      '/api/extreme/reservation/no-show': { post: { summary: 'Rezervasyon no-show', tags: ['extreme'] } },
      '/api/extreme/waitlist/expire': { post: { summary: 'Waitlist expire sweep', tags: ['extreme'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['extreme-waitlist-expires']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'extreme-waitlist',`, `'extreme-waitlist',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE39_WIRE_OK');
