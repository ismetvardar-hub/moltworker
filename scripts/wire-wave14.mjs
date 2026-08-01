#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{ confirmCultureTicket, createCultureEvent, cultureSceneOverview, holdCultureTicket, releaseCultureHold, setCultureLive \} from '\.\/culturescene\.js';/,
  `import {
  confirmCultureTicket,
  createCultureEvent,
  cultureSceneOverview,
  endCultureStream,
  holdCultureTicket,
  pulseCultureStream,
  releaseCultureHold,
  setCultureLive,
  setCultureStageStatus,
  startCultureStream,
} from './culturescene.js';`,
);

const routes = `
        if (path === '/api/culture/stream/start' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, startCultureStream(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/stream/pulse' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, pulseCultureStream(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/stream/end' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, endCultureStream(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/culture/stage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, setCultureStageStatus(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/culture/stream/start'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/culture\/live'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/culture/stream/start'")) {
  oa = oa.replace(
    `'/api/campusbrief/actions': { post: { summary: 'Brif aksiyon kayıt sync', tags: ['campusbrief'] } },`,
    `'/api/campusbrief/actions': { post: { summary: 'Brif aksiyon kayıt sync', tags: ['campusbrief'] } },
      '/api/culture/stream/start': { post: { summary: 'Canlı yayın başlat', tags: ['culturescene'] } },
      '/api/culture/stream/pulse': { post: { summary: 'Yayın izleyici nabzı', tags: ['culturescene'] } },
      '/api/culture/stream/end': { post: { summary: 'Yayın bitir', tags: ['culturescene'] } },
      '/api/culture/stage': { post: { summary: 'Sahne ready/fitout', tags: ['culturescene'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
if (!ops.includes("'culture-streams'")) {
  ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  'culture-streams',`);
  console.log('ops culture-streams');
}
write('server/ops.js', ops);

console.log('WAVE14_WIRE_OK');
