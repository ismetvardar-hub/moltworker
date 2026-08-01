#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{\s*checkoutStay,\s*completeStayGuestRequest,\s*completeStayHk,\s*createStayBooking,\s*createStayGuestRequest,\s*createStayHkTask,\s*issueStayKeyless,\s*setStayWintering,\s*stayNightRollup,\s*stayRingOverview,\s*updateStayUnit,\s*\} from '\.\/stayring\.js';/,
  `import {
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
} from './stayring.js';`,
);

const routes = `
        if (path === '/api/stayring/folio/charge' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, postStayFolioCharge(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/folio/auto' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, autoPostStayFolio(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/stayring/folio/settle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, settleStayFolio(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/stayring/folio/charge'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/stayring\/request\/complete'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/stayring/folio/charge'")) {
  oa = oa.replace(
    `'/api/stayring/request/complete': { post: { summary: 'Misafir istek tamamla', tags: ['stayring'] } },`,
    `'/api/stayring/request/complete': { post: { summary: 'Misafir istek tamamla', tags: ['stayring'] } },
      '/api/stayring/folio/charge': { post: { summary: 'Folio satırı yaz', tags: ['stayring'] } },
      '/api/stayring/folio/auto': { post: { summary: 'Otomatik lodging folio', tags: ['stayring'] } },
      '/api/stayring/folio/settle': { post: { summary: 'Folio tahsil et', tags: ['stayring'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['stay-folio-charges', 'stay-folio-settlements']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE25_WIRE_OK');
