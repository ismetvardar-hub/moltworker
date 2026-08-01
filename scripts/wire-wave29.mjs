#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ athleteOsOverview, athleteReadinessRollup, issueAthleteLicense, logAthleteSession, setAthleteClearance, upsertAthletePlan \} from '\.\/athleteos\.js';/,
  `import {
  advanceReturnToPlay,
  athleteOsOverview,
  athleteReadinessRollup,
  issueAthleteLicense,
  logAthleteSession,
  reportAthleteInjury,
  runAthleteRtpSweep,
  setAthleteClearance,
  upsertAthletePlan,
} from './athleteos.js';`,
);

const routes = `
        if (path === '/api/athleteos/injury' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, reportAthleteInjury(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/athleteos/return-to-play' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, advanceReturnToPlay(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/athleteos/rtp-sweep' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runAthleteRtpSweep(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/athleteos/injury'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/athleteos\/clearance'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/athleteos/injury'")) {
  oa = oa.replace(
    `'/api/athleteos/clearance': { post: { summary: 'Tıbbi clearance', tags: ['athleteos'] } },`,
    `'/api/athleteos/clearance': { post: { summary: 'Tıbbi clearance', tags: ['athleteos'] } },
      '/api/athleteos/injury': { post: { summary: 'Sakatlık bildir', tags: ['athleteos'] } },
      '/api/athleteos/return-to-play': { post: { summary: 'RTP aşaması ilerlet', tags: ['athleteos'] } },
      '/api/athleteos/rtp-sweep': { post: { summary: 'RTP risk taraması', tags: ['athleteos'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['athlete-injuries', 'athlete-rtp-events', 'athlete-rtp-sweeps']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE29_WIRE_OK');
