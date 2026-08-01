#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  autoPostStayFolio,
  checkoutStay,
  completeStayGuestRequest,
  completeStayHk,
  createStayBooking,
  createStayGuestRequest,
  createStayHkTask,
  issueStayKeyless,
  postStayFolioCharge,
  setStayWintering,
  settleStayFolio,
  stayNightRollup,
  stayRingOverview,
  updateStayUnit,
} from './stayring.js';`;

const newImport = `import {
  autoPostStayFolio,
  checkoutStay,
  completeStayGuestRequest,
  completeStayHk,
  createStayBooking,
  createStayGuestRequest,
  createStayHkTask,
  flagStayOverstay,
  issueStayKeyless,
  postStayFolioCharge,
  resolveStayOverstay,
  runStayNightAudit,
  setStayWintering,
  settleStayFolio,
  stayNightRollup,
  stayRingOverview,
  updateStayUnit,
} from './stayring.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('runStayNightAudit')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/stayring/night-audit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runStayNightAudit(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/overstay/flag' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, flagStayOverstay(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/overstay/resolve' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, resolveStayOverstay(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/stayring/night-audit'")) {
  const anchor = `        if (path === '/api/stayring/folio/settle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, settleStayFolio(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/stayring/night-audit'")) {
  const oaAnchor = `'/api/stayring/folio/settle': { post: { summary: 'Folio tahsil et', tags: ['stayring'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/stayring/night-audit': { post: { summary: 'Gece audit + lodging folio', tags: ['stayring'] } },
      '/api/stayring/overstay/flag': { post: { summary: 'Overstay işaretle', tags: ['stayring'] } },
      '/api/stayring/overstay/resolve': { post: { summary: 'Overstay çöz', tags: ['stayring'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['stay-night-audits', 'stay-overstays']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'stay-night-rollups',`, `'stay-night-rollups',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE41_WIRE_OK');
