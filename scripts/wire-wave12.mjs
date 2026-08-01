#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');

platform = platform.replace(
  /import \{\s*createExtremeMaas,\s*extremeOverview,\s*extremeSlotWeatherCheck,\s*extremeUserSpec,\s*extremeWalletSpend,\s*signExtremeWaiver,\s*updateExtremeGear,\s*\} from '\.\/extremepark\.js';/,
  `import {
  applyExtremeWeatherHold,
  cancelExtremeReservation,
  clearExtremeWeatherHold,
  createExtremeMaas,
  extremeOverview,
  extremeSlotWeatherCheck,
  extremeUserSpec,
  extremeWalletSpend,
  reserveExtremeSlot,
  returnExtremeGear,
  signExtremeWaiver,
  updateExtremeGear,
} from './extremepark.js';`,
);

platform = platform.replace(
  /import \{ bridgeRecoveryPlan, linkSportProfiles, sportBridgeOverview, syncSlotToSession \} from '\.\/sportbridge\.js';/,
  `import { bridgeRecoveryPlan, linkSportProfiles, runSportEligibilitySweep, sportBridgeOverview, syncSlotToSession } from './sportbridge.js';`,
);

platform = platform.replace(
  /import \{ addGreenIncident, greenPulseOverview, recordGreenMeter \} from '\.\/greenpulse\.js';/,
  `import { addGreenIncident, greenPulseOverview, recordGreenMeter, runGreenPulseAutomations } from './greenpulse.js';`,
);

const routes = `
        if (path === '/api/extreme/weather-hold' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, applyExtremeWeatherHold(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/weather-clear' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, clearExtremeWeatherHold(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/slot-reserve' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, reserveExtremeSlot(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/slot-cancel' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, cancelExtremeReservation(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/extreme/gear-return' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, returnExtremeGear(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/sportbridge/eligibility' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runSportEligibilitySweep(await readBody(req), user.username)); })();
          return;
        }
        if (path === '/api/greenpulse/automations' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => { sendJson(res, 200, runGreenPulseAutomations(await readBody(req), user.username)); })();
          return;
        }
`;

if (!platform.includes("/api/extreme/weather-hold'")) {
  platform = platform.replace(
    /(if \(path === '\/api\/extreme\/slot-weather-check'[\s\S]*?return;\s*\}\n)/,
    `$1${routes}`,
  );
  console.log('routes');
}
write('server/platform.js', platform);

let oa = read('server/openapi.js');
if (!oa.includes("'/api/extreme/weather-hold'")) {
  oa = oa.replace(
    `'/api/athleteos/license': { post: { summary: 'Sporcu lisans ver/yenile', tags: ['athleteos'] } },`,
    `'/api/extreme/weather-hold': { post: { summary: 'Hava hold', tags: ['extreme'] } },
      '/api/extreme/slot-reserve': { post: { summary: 'Slot rezervasyon', tags: ['extreme'] } },
      '/api/extreme/gear-return': { post: { summary: 'Ekipman iade', tags: ['extreme'] } },
      '/api/sportbridge/eligibility': { post: { summary: 'Spor eligibilite taraması', tags: ['sportbridge'] } },
      '/api/greenpulse/automations': { post: { summary: 'ESG remediation playbook', tags: ['greenpulse'] } },
      '/api/athleteos/license': { post: { summary: 'Sporcu lisans ver/yenile', tags: ['athleteos'] } },`,
  );
  write('server/openapi.js', oa);
  console.log('openapi');
}

let ops = read('server/ops.js');
for (const c of ['extreme-reservations', 'sport-eligibility', 'green-automations']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'agent-presence',`, `'agent-presence',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);

console.log('WAVE12_WIRE_OK');
