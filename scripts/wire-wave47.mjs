#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

const oldImport = `import {
  advanceReturnToPlay,
  athleteOsOverview,
  athleteReadinessRollup,
  issueAthleteLicense,
  logAthleteSession,
  reportAthleteInjury,
  runAthleteRtpSweep,
  setAthleteClearance,
  upsertAthletePlan,
} from './athleteos.js';`;

const newImport = `import {
  advanceReturnToPlay,
  athleteOsOverview,
  athleteReadinessRollup,
  clearAthleteForCompetition,
  issueAthleteLicense,
  logAthleteSession,
  registerAthleteCompetition,
  reportAthleteInjury,
  runAthleteCompetitionClearanceSweep,
  runAthleteRtpSweep,
  setAthleteClearance,
  upsertAthletePlan,
} from './athleteos.js';`;

if (platform.includes(oldImport)) {
  platform = platform.replace(oldImport, newImport);
  console.log('import');
} else if (!platform.includes('registerAthleteCompetition')) {
  console.error('IMPORT_PATTERN_MISS');
  process.exit(1);
}

const routes = `
        if (path === '/api/athleteos/competition' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, registerAthleteCompetition(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/athleteos/competition/clear' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, clearAthleteForCompetition(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/athleteos/competition/sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runAthleteCompetitionClearanceSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/athleteos/competition'")) {
  const anchor = `        if (path === '/api/athleteos/rtp-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runAthleteRtpSweep(await readBody(req), user.username)); })();
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
if (!oa.includes("'/api/athleteos/competition'")) {
  const oaAnchor = `'/api/athleteos/rtp-sweep': { post: { summary: 'RTP risk taraması', tags: ['athleteos'] } },`;
  if (!oa.includes(oaAnchor)) {
    console.error('OPENAPI_ANCHOR_MISS');
    process.exit(1);
  }
  oa = oa.replace(
    oaAnchor,
    `${oaAnchor}
      '/api/athleteos/competition': { post: { summary: 'Yarışma kaydı', tags: ['athleteos'] } },
      '/api/athleteos/competition/clear': { post: { summary: 'Yarışma clearance', tags: ['athleteos'] } },
      '/api/athleteos/competition/sweep': { post: { summary: 'Yarışma clearance sweep', tags: ['athleteos'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['athlete-competitions', 'athlete-comp-clearances', 'athlete-comp-clearance-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'athlete-clearances',`, `'athlete-clearances',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE47_WIRE_OK');
