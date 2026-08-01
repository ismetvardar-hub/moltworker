#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  authorizedFamilyCheckout,
  bookFamilyProgram,
  familyCampOverview,
  familyCheckIn,
  familyCheckOut,
  familyEmergencyNote,
  issueFamilyPickupCode,
  runFamilySafetySweep,
  transferFamilyChild,
} from './familycamp.js';`;

const newImport = `import {
  assignFamilyStaff,
  authorizedFamilyCheckout,
  bookFamilyProgram,
  familyCampOverview,
  familyCheckIn,
  familyCheckOut,
  familyEmergencyNote,
  issueFamilyPickupCode,
  runFamilyRollCall,
  runFamilySafetySweep,
  runFamilyStaffRatioSweep,
  transferFamilyChild,
} from './familycamp.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('assignFamilyStaff')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/familycamp/staff/assign' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, assignFamilyStaff(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/familycamp/roll-call' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runFamilyRollCall(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/familycamp/staff-ratio' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runFamilyStaffRatioSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/familycamp/staff/assign'")) {
  const anchor = `        if (path === '/api/familycamp/safety-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runFamilySafetySweep(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/familycamp/staff/assign'")) {
  const oaAnchor = `'/api/familycamp/safety-sweep': { post: { summary: 'Aile güvenlik taraması', tags: ['familycamp'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/familycamp/staff/assign': { post: { summary: 'Aile personel ata', tags: ['familycamp'] } },
      '/api/familycamp/roll-call': { post: { summary: 'Emanet yoklama', tags: ['familycamp'] } },
      '/api/familycamp/staff-ratio': { post: { summary: 'Personel/çocuk oranı sweep', tags: ['familycamp'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['family-staff', 'family-roll-calls', 'family-staff-ratio-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'family-checkins',`, `'family-checkins',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE45_WIRE_OK');
