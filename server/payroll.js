/**
 * Wave 173 - Payroll timesheet and run ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('payroll', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'pay_1',
      employee: 'Ayse',
      amount: 18000,
      status: 'draft',
      hours: 40,
      at: new Date().toISOString(),
    }];
    writeCollection('payroll', seed);
    return seed;
  }
  return list;
}

function openPayrollFlags() {
  const flags = readCollection('payroll-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPayrollFlag(candidate, actor = 'system') {
  const existing = readCollection('payroll-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('pyf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('payroll-flags', list.slice(0, 200));
  return flag;
}

function isMissingTimesheet(row) {
  return row.missingTimesheet === true || row.status === 'missing_timesheet' || row.timesheetStatus === 'missing';
}

export function listPayroll(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPayroll(input = {}, actor = 'system') {
  const row = {
    id: rid('pay'),
    employee: input.employee !== undefined ? input.employee : 'Ayse',
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 18000,
    hours: input.hours !== undefined ? Number(input.hours) || 0 : 40,
    runId: input.runId !== undefined ? input.runId : undefined,
    status: input.status || 'draft',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('payroll', row, 300);
  appendAudit({
    actor,
    action: 'payroll.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePayroll(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.amount !== undefined) next.amount = Number(next.amount) || 0;
  if (next.hours !== undefined) next.hours = Number(next.hours) || 0;
  if (next.overtimeHours !== undefined) next.overtimeHours = Number(next.overtimeHours) || 0;
  list[idx] = next;
  writeCollection('payroll', list);
  appendAudit({ actor, action: 'payroll.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function payrollSummary() {
  const list = listPayroll();
  const missingTimesheets = list.filter(isMissingTimesheet);
  const overtimeRows = list.filter((x) => x.overtime === true || Number(x.overtimeHours ?? 0) > 0);
  const flags = openPayrollFlags();
  return {
    title: 'LIKYA Payroll Ops',
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    approved: list.filter((x) => x.status === 'approved').length,
    paid: list.filter((x) => x.status === 'paid').length,
    missing_timesheet: list.filter((x) => x.status === 'missing_timesheet').length,
    missingTimesheets: missingTimesheets.length,
    overtimeRows: overtimeRows.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      draft: list.filter((x) => x.status === 'draft').length,
      approved: list.filter((x) => x.status === 'approved').length,
      paid: list.filter((x) => x.status === 'paid').length,
      missing_timesheets: missingTimesheets.length,
      overtime_rows: overtimeRows.length,
    },
    summaryLines: [
      `Payroll ${list.length} row - missing timesheet ${missingTimesheets.length} - approved ${list.filter((x) => x.status === 'approved').length}`,
      `Overtime ${overtimeRows.length} - draft ${list.filter((x) => x.status === 'draft').length} - flag ${flags.length}`,
    ],
    payroll: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPayrollSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = payrollSummary();
  const created = [];
  const candidates = [];
  if (force || overview.missingTimesheets > 0) {
    candidates.push({
      key: 'payroll_missing_timesheet',
      level: overview.missingTimesheets > 0 ? 'warn' : 'info',
      text: `Payroll missing timesheets ${overview.missingTimesheets}`,
      domain: 'timesheet',
    });
  }
  if (force || overview.draft > 0) {
    candidates.push({
      key: 'payroll_draft_run',
      level: 'info',
      text: `Payroll draft rows ${overview.draft}`,
      domain: 'run',
    });
  }
  if (force || overview.overtimeRows > 0) {
    candidates.push({
      key: 'payroll_overtime',
      level: 'info',
      text: `Payroll overtime rows ${overview.overtimeRows}`,
      domain: 'overtime',
    });
  }
  for (const candidate of candidates) {
    const flag = addPayrollFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `payroll sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pys'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('payroll-sweeps', sweep, 80);
  appendAudit({ actor, action: 'payroll.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: payrollSummary() };
}

export function ackPayrollFlag(input = {}, actor = 'system') {
  const list = readCollection('payroll-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('payroll-flags', list);
  appendAudit({ actor, action: 'payroll.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: payrollSummary() };
}

export function markPayrollMissingTimesheet(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.employee && x.employee === input.employee));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isMissingTimesheet(x));
  if (idx < 0) return { ok: false, error: 'Missing timesheet yapilacak payroll row yok' };
  list[idx] = {
    ...list[idx],
    status: 'missing_timesheet',
    missingTimesheet: true,
    timesheetStatus: 'missing',
    missingSince: input.missingSince || new Date().toISOString(),
    missingBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('payroll', list);
  appendAudit({ actor, action: 'payroll.missing_timesheet', detail: list[idx].employee || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, payroll: list[idx], overview: payrollSummary() };
}

export function approvePayrollRun(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.employee && x.employee === input.employee));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'draft' || isMissingTimesheet(x));
  if (idx < 0) return { ok: false, error: 'Approve edilecek payroll row yok' };
  list[idx] = {
    ...list[idx],
    status: 'approved',
    missingTimesheet: false,
    timesheetStatus: 'approved',
    runId: input.runId || list[idx].runId || `run_${new Date().toISOString().slice(0, 10)}`,
    approvedAt: input.approvedAt || new Date().toISOString(),
    approvedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('payroll', list);
  appendAudit({ actor, action: 'payroll.approve_run', detail: list[idx].employee || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, payroll: list[idx], overview: payrollSummary() };
}

export function seedPayrollOvertime(input = {}, actor = 'system') {
  const payroll = createPayroll(
    {
      employee: input.employee || 'Overtime Team',
      amount: Number(input.amount ?? 22500) || 22500,
      hours: Number(input.hours ?? 48) || 48,
      status: input.status || 'draft',
      runId: input.runId || 'overtime',
    },
    actor,
  );
  const patched = updatePayroll(
    payroll.id,
    {
      overtime: true,
      overtimeHours: Number(input.overtimeHours ?? 8) || 8,
      missingTimesheet: true,
      timesheetStatus: 'missing',
      source: 'wave173',
    },
    actor,
  );
  appendAudit({ actor, action: 'payroll.seed_overtime', detail: patched?.employee || payroll.employee, meta: { id: payroll.id } });
  return { ok: true, payroll: patched || payroll, overview: payrollSummary() };
}
