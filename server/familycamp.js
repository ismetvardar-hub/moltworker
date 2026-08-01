/**
 * Aile & çocuk — kamp, yaz okulu, güvenli emanet + rezervasyon.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensurePrograms() {
  let list = readCollection('family-programs', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'fp_1', kind: 'summer_school', title: 'Yaz Okulu Trail Kids', ages: '7-12', seats: 24, booked: 18, status: 'open' },
      { id: 'fp_2', kind: 'camp', title: 'Hafta Sonu Aile Kampı', ages: 'all', seats: 40, booked: 40, status: 'full' },
      { id: 'fp_3', kind: 'daycare', title: 'Güvenli Emanet (yarım gün)', ages: '4-10', seats: 16, booked: 9, status: 'open' },
    ];
    writeCollection('family-programs', list);
  }
  return list;
}

function ensureCheckins() {
  const list = readCollection('family-checkins', null);
  return Array.isArray(list) ? list : [];
}

function refreshProgramStatus(p) {
  if (p.booked >= p.seats) return { ...p, status: 'full' };
  return { ...p, status: p.status === 'full' ? 'open' : p.status || 'open' };
}

export function familyCampOverview() {
  const programs = ensurePrograms().map(refreshProgramStatus);
  const checkins = ensureCheckins();
  const notes = readCollection('family-notes', []) || [];
  const transfers = readCollection('family-transfers', []) || [];
  const pickups = readCollection('family-pickup-codes', []) || [];
  const custody = readCollection('family-custody-ledger', []) || [];
  const activeCodes = (Array.isArray(pickups) ? pickups : []).filter((p) => p.status === 'active');
  return {
    title: 'Aile & Çocuk',
    programs,
    checkins: checkins.slice(0, 20),
    notes: (Array.isArray(notes) ? notes : []).slice(0, 15),
    transfers: (Array.isArray(transfers) ? transfers : []).slice(0, 15),
    pickup_codes: activeCodes.slice(0, 20),
    custody_ledger: (Array.isArray(custody) ? custody : []).slice(0, 20),
    summary: {
      open: programs.filter((p) => p.status === 'open').length,
      full: programs.filter((p) => p.status === 'full').length,
      in_care: checkins.filter((c) => c.status === 'in_care').length,
      seats_left: programs.reduce((s, p) => s + Math.max(0, (p.seats || 0) - (p.booked || 0)), 0),
      transfers: Array.isArray(transfers) ? transfers.length : 0,
      pickup_codes_active: activeCodes.length,
      custody_events: Array.isArray(custody) ? custody.length : 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function bookFamilyProgram(input = {}, actor = 'system') {
  const programs = ensurePrograms();
  let idx = programs.findIndex((p) => p.id === (input.program_id || 'fp_1'));
  if (idx < 0) return { ok: false, error: 'Program yok' };
  let p = programs[idx];
  if (p.booked >= p.seats) {
    // doluysa açık kontenjanlı programa düş
    const alt = programs.findIndex((x) => (x.booked || 0) < (x.seats || 0));
    if (alt < 0) {
      // hepsi doluysa kontenjan genişlet (demo ops)
      p = { ...p, seats: (Number(p.seats) || 0) + 8 };
      programs[idx] = p;
    } else {
      idx = alt;
      p = programs[idx];
    }
  }
  p = refreshProgramStatus({ ...p, booked: (Number(p.booked) || 0) + 1 });
  programs[idx] = p;
  writeCollection('family-programs', programs);
  const booking = {
    id: rid('fb'),
    program_id: p.id,
    child_name: input.child_name || 'Çocuk',
    guardian: input.guardian || actor,
    at: new Date().toISOString(),
  };
  prependItem('family-bookings', booking, 300);
  appendAudit({ actor, action: 'family.book', detail: `${p.title} · ${booking.child_name}`, meta: { id: booking.id } });
  return { ok: true, booking, program: p, overview: familyCampOverview() };
}

export function familyCheckIn(input = {}, actor = 'system') {
  const programs = ensurePrograms();
  const prog = programs.find((p) => p.id === (input.program_id || 'fp_3'));
  if (prog && prog.kind === 'daycare' && prog.booked >= prog.seats && input.require_seat) {
    return { ok: false, error: 'Emanet kontenjanı dolu' };
  }
  const row = {
    id: rid('fc'),
    child_name: input.child_name || 'Çocuk',
    guardian: input.guardian || 'Veli',
    program_id: input.program_id || 'fp_3',
    allergy: input.allergy || null,
    status: 'in_care',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-checkins', row, 300);
  appendAudit({ actor, action: 'family.checkin', detail: `${row.child_name} · ${row.guardian}`, meta: { id: row.id } });
  return { ok: true, checkin: row, overview: familyCampOverview() };
}

export function familyCheckOut(id, actor = 'system') {
  const list = ensureCheckins();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) {
    const live = list.findIndex((c) => c.status === 'in_care');
    if (live < 0) return { ok: false, error: 'Açık emanet yok' };
    list[live] = { ...list[live], status: 'returned', out_at: new Date().toISOString() };
    writeCollection('family-checkins', list);
    appendAudit({ actor, action: 'family.checkout', detail: list[live].child_name, meta: { id: list[live].id } });
    return { ok: true, checkin: list[live], overview: familyCampOverview() };
  }
  list[idx] = { ...list[idx], status: 'returned', out_at: new Date().toISOString() };
  writeCollection('family-checkins', list);
  appendAudit({ actor, action: 'family.checkout', detail: list[idx].child_name, meta: { id } });
  return { ok: true, checkin: list[idx], overview: familyCampOverview() };
}

/** Emanet / program arası transfer */
export function transferFamilyChild(input = {}, actor = 'system') {
  const checkins = ensureCheckins();
  let idx = checkins.findIndex((c) => c.id === input.checkin_id && c.status === 'in_care');
  if (idx < 0) idx = checkins.findIndex((c) => c.child_name === input.child_name && c.status === 'in_care');
  if (idx < 0) idx = checkins.findIndex((c) => c.status === 'in_care');
  if (idx < 0) return { ok: false, error: 'Açık emanet yok' };
  const to = input.to_program_id || 'fp_1';
  const programs = ensurePrograms();
  const prog = programs.find((p) => p.id === to);
  if (!prog) return { ok: false, error: 'Hedef program yok' };
  const from = checkins[idx].program_id;
  checkins[idx] = {
    ...checkins[idx],
    program_id: to,
    transferred_from: from,
    transferred_at: new Date().toISOString(),
    note: input.note || `transfer ${from} → ${to}`,
  };
  writeCollection('family-checkins', checkins);
  const row = {
    id: rid('ft'),
    checkin_id: checkins[idx].id,
    child_name: checkins[idx].child_name,
    from,
    to,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-transfers', row, 200);
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `transfer · ${row.child_name} · ${from}→${to}`,
      priority: 'normal',
      payload: { transfer_id: row.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'family.transfer',
    detail: `${row.child_name} ${from}→${to}`,
    meta: { id: row.id },
  });
  return { ok: true, transfer: row, checkin: checkins[idx], overview: familyCampOverview() };
}

export function familyEmergencyNote(input = {}, actor = 'system') {
  const row = {
    id: rid('fn'),
    child_name: input.child_name || 'Çocuk',
    note: input.note || 'Acil not',
    severity: input.severity || 'high',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-notes', row, 200);
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `Aile acil: ${row.child_name} — ${row.note}`,
      priority: 'high',
      payload: { note_id: row.id },
    },
    actor,
  );
  appendAudit({ actor, action: 'family.emergency', detail: row.note, meta: { id: row.id } });
  return { ok: true, note: row, overview: familyCampOverview() };
}

/** Yetkili teslim kodu — kısa ömürlü */
export function issueFamilyPickupCode(input = {}, actor = 'system') {
  const checkins = ensureCheckins();
  let idx = checkins.findIndex((c) => c.id === input.checkin_id && c.status === 'in_care');
  if (idx < 0) idx = checkins.findIndex((c) => c.child_name === input.child_name && c.status === 'in_care');
  if (idx < 0) idx = checkins.findIndex((c) => c.status === 'in_care');
  if (idx < 0) return { ok: false, error: 'Açık emanet yok' };
  const checkin = checkins[idx];
  const minutes = Number(input.minutes) || 45;
  const code = String(input.code || Math.floor(100000 + Math.random() * 900000));
  const row = {
    id: rid('fpc'),
    checkin_id: checkin.id,
    child_name: checkin.child_name,
    code,
    authorized_name: input.authorized_name || checkin.guardian || 'Veli',
    relation: input.relation || 'guardian',
    status: 'active',
    expires_at: new Date(Date.now() + minutes * 60_000).toISOString(),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-pickup-codes', row, 300);
  checkins[idx] = { ...checkin, pickup_code_id: row.id, authorized_pickup: row.authorized_name };
  writeCollection('family-checkins', checkins);
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `pickup kod · ${row.child_name} · ${row.authorized_name}`,
      priority: 'normal',
      payload: { pickup_id: row.id, checkin_id: checkin.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'family.pickup_code',
    detail: `${row.child_name} · ${row.authorized_name}`,
    meta: { id: row.id },
  });
  return { ok: true, pickup: row, overview: familyCampOverview() };
}

/** Kod / yetkili isim ile güvenli teslim */
export function authorizedFamilyCheckout(input = {}, actor = 'system') {
  const codes = readCollection('family-pickup-codes', []) || [];
  const codeList = Array.isArray(codes) ? codes : [];
  let pidx = codeList.findIndex(
    (p) =>
      p.status === 'active' &&
      (p.code === String(input.code || '') || p.id === input.pickup_id || p.id === input.id),
  );
  if (pidx < 0 && input.authorized_name) {
    pidx = codeList.findIndex(
      (p) =>
        p.status === 'active' &&
        String(p.authorized_name).toLowerCase() === String(input.authorized_name).toLowerCase(),
    );
  }
  if (pidx < 0) return { ok: false, error: 'Geçerli pickup kodu yok' };
  const pickup = codeList[pidx];
  if (pickup.expires_at && new Date(pickup.expires_at).getTime() < Date.now() && !input.force) {
    codeList[pidx] = { ...pickup, status: 'expired' };
    writeCollection('family-pickup-codes', codeList);
    return { ok: false, error: 'Pickup kodu süresi doldu' };
  }
  const checkins = ensureCheckins();
  const cidx = checkins.findIndex((c) => c.id === pickup.checkin_id && c.status === 'in_care');
  if (cidx < 0) return { ok: false, error: 'Emanet zaten teslim edilmiş' };
  const presented = input.authorized_name || pickup.authorized_name;
  checkins[cidx] = {
    ...checkins[cidx],
    status: 'returned',
    out_at: new Date().toISOString(),
    returned_to: presented,
    checkout_mode: 'authorized',
  };
  writeCollection('family-checkins', checkins);
  codeList[pidx] = { ...pickup, status: 'used', used_at: new Date().toISOString(), used_by: presented };
  writeCollection('family-pickup-codes', codeList);
  const ledger = {
    id: rid('fcl'),
    checkin_id: checkins[cidx].id,
    child_name: checkins[cidx].child_name,
    authorized_name: presented,
    pickup_id: pickup.id,
    code: pickup.code,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-custody-ledger', ledger, 400);
  appendAudit({
    actor,
    action: 'family.authorized_checkout',
    detail: `${ledger.child_name} → ${presented}`,
    meta: { id: ledger.id },
  });
  return { ok: true, checkin: checkins[cidx], pickup: codeList[pidx], ledger, overview: familyCampOverview() };
}

/** Alerji / acil / bayat emanet taraması */
export function runFamilySafetySweep(input = {}, actor = 'system') {
  const checkins = ensureCheckins();
  const notes = readCollection('family-notes', []) || [];
  const noteList = Array.isArray(notes) ? notes : [];
  const hours = Number(input.stale_hours) || 6;
  const cutoff = Date.now() - hours * 3600_000;
  const flags = [];
  for (const c of checkins.filter((x) => x.status === 'in_care')) {
    if (c.allergy) {
      flags.push({ kind: 'allergy', checkin_id: c.id, child_name: c.child_name, detail: c.allergy });
    }
    if (c.at && new Date(c.at).getTime() < cutoff) {
      flags.push({ kind: 'stale_in_care', checkin_id: c.id, child_name: c.child_name, detail: c.at });
    }
    const related = noteList.filter(
      (n) => n.child_name === c.child_name && (n.severity === 'high' || n.severity === 'critical'),
    );
    for (const n of related.slice(0, 2)) {
      flags.push({ kind: 'emergency_note', checkin_id: c.id, child_name: c.child_name, detail: n.note });
    }
  }
  const jobs = [];
  for (const f of flags.slice(0, 12)) {
    const job = enqueueAgentJob(
      {
        agent: 'DAZE-CREW',
        title: `family safety · ${f.kind} · ${f.child_name}`,
        priority: f.kind === 'allergy' || f.kind === 'emergency_note' ? 'high' : 'normal',
        payload: f,
      },
      actor,
    );
    jobs.push(job?.id || f.checkin_id);
  }
  const sweep = {
    id: rid('fss'),
    flags: flags.length,
    by_kind: flags.reduce((acc, f) => {
      acc[f.kind] = (acc[f.kind] || 0) + 1;
      return acc;
    }, {}),
    jobs: jobs.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-safety-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'family.safety_sweep',
    detail: `${sweep.flags} bayrak`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, flags, overview: familyCampOverview() };
}
