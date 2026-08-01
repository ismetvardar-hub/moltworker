#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ ackCampusBriefAction, campusBriefOverview, campusHealthCheck, runCampusAutomations, syncCampusBriefActions \} from '\.\/campusbrief\.js';/,
  `import {
  ackCampusBriefAction,
  assignCampusBriefAction,
  campusBriefOverview,
  campusHealthCheck,
  publishCampusBriefDigest,
  runCampusAutomations,
  syncCampusBriefActions,
} from './campusbrief.js';`,
);

const routes = `
        if (path === '/api/campusbrief/actions/assign' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, assignCampusBriefAction(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/campusbrief/publish' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, publishCampusBriefDigest(user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/campusbrief/publish'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/campusbrief\/actions\/ack'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/campusbrief/publish'")) {
  oa = oa.replace(
    `'/api/campusbrief/actions/ack': { post: { summary: 'Brif aksiyon ack', tags: ['campusbrief'] } },`,
    `'/api/campusbrief/actions/ack': { post: { summary: 'Brif aksiyon ack', tags: ['campusbrief'] } },
      '/api/campusbrief/actions/assign': { post: { summary: 'Brif aksiyon ata', tags: ['campusbrief'] } },
      '/api/campusbrief/publish': { post: { summary: 'CEO brif digest yayınla', tags: ['campusbrief'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
if (!ops.includes("'campus-brief-digests'")) {
  ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  'campus-brief-digests',`);
  console.log('ops campus-brief-digests');
}
write('server/ops.js', ops);

console.log('WAVE36_WIRE_OK');
