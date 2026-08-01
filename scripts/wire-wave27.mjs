#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ bookFamilyProgram, familyCampOverview, familyCheckIn, familyCheckOut, familyEmergencyNote, transferFamilyChild \} from '\.\/familycamp\.js';/,
  `import {
  authorizedFamilyCheckout,
  bookFamilyProgram,
  familyCampOverview,
  familyCheckIn,
  familyCheckOut,
  familyEmergencyNote,
  issueFamilyPickupCode,
  runFamilySafetySweep,
  transferFamilyChild,
} from './familycamp.js';`,
);

const routes = `
        if (path === '/api/familycamp/pickup-code' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, issueFamilyPickupCode(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/familycamp/authorized-checkout' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, authorizedFamilyCheckout(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/familycamp/safety-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runFamilySafetySweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/familycamp/pickup-code'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/familycamp\/transfer'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/familycamp/pickup-code'")) {
  oa = oa.replace(
    `'/api/familycamp/transfer': { post: { summary: 'Emanet/program transfer', tags: ['familycamp'] } },`,
    `'/api/familycamp/transfer': { post: { summary: 'Emanet/program transfer', tags: ['familycamp'] } },
      '/api/familycamp/pickup-code': { post: { summary: 'Yetkili pickup kodu', tags: ['familycamp'] } },
      '/api/familycamp/authorized-checkout': { post: { summary: 'Yetkili teslim', tags: ['familycamp'] } },
      '/api/familycamp/safety-sweep': { post: { summary: 'Aile güvenlik taraması', tags: ['familycamp'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['family-pickup-codes', 'family-custody-ledger', 'family-safety-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE27_WIRE_OK');
