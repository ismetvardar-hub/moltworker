#!/usr/bin/env node
/**
 * Wave-54 wiring reference — applied in-place (stay late-checkout / folio dispute / keyless revoke).
 * Re-run is idempotent against current platform/openapi/ops anchors.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (r) => fs.readFileSync(path.join(root, r), 'utf8');
const write = (r, s) => fs.writeFileSync(path.join(root, r), s);

let platform = read('server/platform.js');
if (!platform.includes('scheduleStayLateCheckout')) {
  console.error('IMPORT_MISSING — apply wave54 stayring patch first');
  process.exit(1);
}
if (!platform.includes("/api/stayring/late-checkout'")) {
  console.error('ROUTES_MISSING');
  process.exit(1);
}
let oa = read('server/openapi.js');
if (!oa.includes("'/api/stayring/late-checkout'")) {
  console.error('OPENAPI_MISSING');
  process.exit(1);
}
let ops = read('server/ops.js');
for (const c of ['stay-late-checkouts', 'stay-folio-disputes', 'stay-key-revocations']) {
  if (!ops.includes(`'${c}'`)) {
    ops = ops.replace(`'stay-overstays',`, `'stay-overstays',\n  '${c}',`);
    console.log('ops', c);
  }
}
write('server/ops.js', ops);
console.log('WAVE54_WIRE_OK');
