/**
 * AŞAMA 4–5 — Platform API: auth + arşiv + hub + ayarlar + audit
 */

import { login, logout, sessionFromToken, listDemoUsers, ROLE_PAGES } from './auth.js';
import {
  readCollection,
  writeCollection,
  prependItem,
  deleteItem,
  clearCollection,
} from './store.js';
import { appendAudit, readAudit } from './audit.js';
import { applySettingsToEnv, getPublicSettings, saveSettings } from './settings.js';
import {
  cancelJob,
  claimDirective,
  createJob,
  deleteJob,
  getJob,
  jobsSummary,
  listJobs,
  runJob,
  startJobTicker,
  tickJobs,
} from './jobs.js';
import { addSseClient, sseClientCount } from './events.js';
import { buildOpsReport, reportToMarkdown } from './report.js';

applySettingsToEnv();
startJobTicker(5000);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

function requireUser(req, res) {
  const user = sessionFromToken(getToken(req));
  if (!user) {
    sendJson(res, 401, { error: 'Oturum gerekli' });
    return null;
  }
  return user;
}

function requireCeo(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'ceo') {
    sendJson(res, 403, { error: 'Yalnızca CEO erişebilir' });
    return null;
  }
  return user;
}

function hubSummary() {
  const archive = readCollection('archive', []);
  const whatsapp = readCollection('whatsapp', []);
  const nexus = readCollection('nexus-events', []);
  const audit = readAudit(12);
  const settings = getPublicSettings();
  const byAgent = {};
  for (const e of archive) {
    for (const a of e.agents ?? []) byAgent[a] = (byAgent[a] ?? 0) + 1;
  }
  const configuredKeys = settings.fields.filter((f) => f.configured).length;
  const jobs = jobsSummary();
  return {
    archiveCount: archive.length,
    whatsappCount: whatsapp.length,
    nexusEventCount: nexus.length,
    auditCount: readCollection('audit', []).length,
    settingsConfigured: configuredKeys,
    settingsTotal: settings.fields.length,
    jobsTotal: jobs.total,
    jobsByStatus: jobs.byStatus,
    upcomingJobs: jobs.upcoming,
    readyDirectives: jobs.readyDirectives,
    sseClients: sseClientCount(),
    recentArchive: archive.slice(0, 5),
    recentWhatsapp: whatsapp.slice(0, 5),
    recentNexus: nexus.slice(0, 8),
    recentAudit: audit,
    recentJobs: jobs.recent,
    agentHits: Object.entries(byAgent)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    generatedAt: new Date().toISOString(),
  };
}

/** Connect uyumlu middleware — hem Vite hem production sunucusu kullanır. */
export function createPlatformMiddleware() {
  return (req, res, next) => {
        const path = (req.url ?? '').split('?')[0];

        if (req.method === 'OPTIONS' && path.startsWith('/api/')) {
          sendJson(res, 204, {});
          return;
        }

        // Auth
        if (path === '/api/auth/demo-users' && req.method === 'GET') {
          sendJson(res, 200, { users: listDemoUsers(), rolePages: ROLE_PAGES });
          return;
        }
        if (path === '/api/auth/login' && req.method === 'POST') {
          void (async () => {
            try {
              const { username, password } = await readBody(req);
              const result = login(username, password);
              if (!result) {
                appendAudit({
                  actor: username || 'unknown',
                  action: 'auth.login_failed',
                  detail: 'Hatalı kimlik bilgisi',
                });
                sendJson(res, 401, { error: 'Kullanıcı adı veya şifre hatalı' });
                return;
              }
              appendAudit({
                actor: result.user.username,
                action: 'auth.login',
                detail: `${result.user.name} oturum açtı (${result.user.role})`,
              });
              sendJson(res, 200, result);
            } catch (err) {
              sendJson(res, 500, { error: err instanceof Error ? err.message : 'Login hatası' });
            }
          })();
          return;
        }
        if (path === '/api/auth/logout' && req.method === 'POST') {
          const user = sessionFromToken(getToken(req));
          logout(getToken(req));
          if (user) {
            appendAudit({
              actor: user.username,
              action: 'auth.logout',
              detail: 'Oturum kapatıldı',
            });
          }
          sendJson(res, 200, { ok: true });
          return;
        }
        if (path === '/api/auth/me' && req.method === 'GET') {
          const user = sessionFromToken(getToken(req));
          if (!user) {
            sendJson(res, 401, { error: 'Oturum yok' });
            return;
          }
          sendJson(res, 200, { user });
          return;
        }

        // Kalıcı arşiv
        if (path === '/api/archive' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { entries: readCollection('archive', []) });
          return;
        }
        if (path === '/api/archive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            try {
              const entry = await readBody(req);
              if (!entry?.id || !entry?.text) {
                sendJson(res, 400, { error: 'Geçersiz arşiv kaydı' });
                return;
              }
              const entries = prependItem('archive', entry, 200);
              appendAudit({
                actor: user.username,
                action: 'archive.save',
                detail: String(entry.text).slice(0, 100),
                meta: { id: entry.id, agents: entry.agents },
              });
              sendJson(res, 200, { ok: true, entries });
            } catch (err) {
              sendJson(res, 500, { error: err instanceof Error ? err.message : 'Arşiv yazılamadı' });
            }
          })();
          return;
        }
        if (path.startsWith('/api/archive/') && req.method === 'DELETE') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = Number(path.split('/').pop());
          appendAudit({
            actor: user.username,
            action: 'archive.delete',
            detail: `Kayıt silindi: ${id}`,
          });
          sendJson(res, 200, { entries: deleteItem('archive', id) });
          return;
        }
        if (path === '/api/archive' && req.method === 'DELETE') {
          const user = requireUser(req, res);
          if (!user) return;
          clearCollection('archive');
          appendAudit({
            actor: user.username,
            action: 'archive.clear',
            detail: 'Arşiv temizlendi',
          });
          sendJson(res, 200, { entries: [] });
          return;
        }

        // Hub özeti
        if (path === '/api/hub/summary' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, hubSummary());
          return;
        }

        // Audit
        if (path === '/api/audit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          const limit = Number(url.searchParams.get('limit') || 50);
          sendJson(res, 200, { entries: readAudit(limit) });
          return;
        }

        // Ayarlar (CEO)
        if (path === '/api/settings' && req.method === 'GET') {
          if (!requireCeo(req, res)) return;
          sendJson(res, 200, getPublicSettings());
          return;
        }
        if (path === '/api/settings' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            try {
              const patch = await readBody(req);
              const result = saveSettings(patch);
              appendAudit({
                actor: user.username,
                action: 'settings.update',
                detail: `Ayarlar güncellendi (${result.fields.filter((f) => f.configured).length}/${result.fields.length} yapılandırıldı)`,
              });
              sendJson(res, 200, result);
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Ayarlar kaydedilemedi',
              });
            }
          })();
          return;
        }

        // Görevler / kuyruk (AŞAMA 6)
        if (path === '/api/jobs' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            jobs: listJobs({
              status: url.searchParams.get('status') || undefined,
              kind: url.searchParams.get('kind') || undefined,
            }),
            summary: jobsSummary(),
          });
          return;
        }
        if (path === '/api/jobs' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            try {
              const body = await readBody(req);
              if (!body.kind) {
                sendJson(res, 400, { error: 'kind zorunlu (whatsapp.reminder | directive.queue)' });
                return;
              }
              if (
                body.kind !== 'whatsapp.reminder' &&
                body.kind !== 'directive.queue'
              ) {
                sendJson(res, 400, { error: 'Geçersiz kind' });
                return;
              }
              // kitchen yalnızca whatsapp; crew talimat kuyruğu oluşturamaz
              if (user.role === 'kitchen' && body.kind !== 'whatsapp.reminder') {
                sendJson(res, 403, { error: 'Mutfak yalnızca WhatsApp hatırlatması oluşturabilir' });
                return;
              }
              if (user.role === 'crew') {
                sendJson(res, 403, { error: 'Crew rolü görev oluşturamaz' });
                return;
              }
              const job = createJob({
                kind: body.kind,
                title: body.title,
                payload: body.payload,
                dueAt: body.dueAt,
                createdBy: user.username,
              });
              // dueAt geçmişse hemen tick
              if (new Date(job.dueAt).getTime() <= Date.now()) {
                const ran = await runJob(job.id, user.username);
                sendJson(res, 200, { job: ran });
                return;
              }
              sendJson(res, 200, { job });
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Görev oluşturulamadı',
              });
            }
          })();
          return;
        }
        if (path === '/api/jobs/tick' && req.method === 'POST') {
          if (!requireCeo(req, res)) return;
          void (async () => {
            const results = await tickJobs();
            sendJson(res, 200, { ran: results.length, results });
          })();
          return;
        }
        if (path.startsWith('/api/jobs/') && path.endsWith('/run') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          void (async () => {
            const job = await runJob(id, user.username);
            if (!job) {
              sendJson(res, 404, { error: 'Görev bulunamadı' });
              return;
            }
            sendJson(res, 200, { job });
          })();
          return;
        }
        if (path.startsWith('/api/jobs/') && path.endsWith('/cancel') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const job = cancelJob(id, user.username);
          if (!job) {
            sendJson(res, 404, { error: 'Görev bulunamadı' });
            return;
          }
          sendJson(res, 200, { job });
          return;
        }
        if (path.startsWith('/api/jobs/') && path.endsWith('/claim') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew talimat claim edemez' });
            return;
          }
          const id = path.split('/')[3];
          void (async () => {
            const result = await claimDirective(id, user.username);
            if (!result) {
              sendJson(res, 404, { error: 'Talimat görevi bulunamadı' });
              return;
            }
            if (result.error) {
              sendJson(res, 409, { error: result.error, job: result.job });
              return;
            }
            sendJson(res, 200, { job: result.job, text: result.text });
          })();
          return;
        }
        // Operasyon raporu (AŞAMA 8)
        if (path === '/api/report' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          const format = url.searchParams.get('format') || 'json';
          const report = buildOpsReport();
          if (format === 'markdown' || format === 'md') {
            const md = reportToMarkdown(report);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="likya-rapor-${report.generatedAt.slice(0, 10)}.md"`,
            );
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(md);
            return;
          }
          sendJson(res, 200, report);
          return;
        }

        // SSE canlı olay akışı (AŞAMA 7) — token query ile (EventSource header desteklemez)
        if (path === '/api/events' && req.method === 'GET') {
          const url = new URL(req.url ?? '', 'http://local');
          const token = url.searchParams.get('token') || getToken(req);
          const user = sessionFromToken(token);
          if (!user) {
            sendJson(res, 401, { error: 'Oturum gerekli' });
            return;
          }
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(`: connected as ${user.username}\n\n`);
          addSseClient(res);
          return;
        }
        if (path.startsWith('/api/jobs/') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const job = getJob(id);
          if (!job) {
            sendJson(res, 404, { error: 'Görev bulunamadı' });
            return;
          }
          sendJson(res, 200, { job });
          return;
        }
        if (path.startsWith('/api/jobs/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          sendJson(res, 200, { jobs: deleteJob(id) });
          return;
        }

        next();
  };
}

export function platformPlugin() {
  return {
    name: 'likya-platform',
    configureServer(server) {
      server.middlewares.use(createPlatformMiddleware());
    },
  };
}

/** Entegrasyon katmanından kalıcı log yazmak için. */
export function persistWhatsapp(entry) {
  const list = prependItem('whatsapp', entry, 100);
  appendAudit({
    actor: 'REMINDER-AI',
    action: 'whatsapp.send',
    detail: String(entry.body ?? '').slice(0, 100),
    meta: { provider: entry.provider, status: entry.status, guest: entry.guest },
  });
  return list;
}

export function persistNexusEvent(event) {
  const list = prependItem('nexus-events', event, 200);
  if (event.action !== 'protocol_ready') {
    appendAudit({
      actor: 'NEXUS',
      action: `nexus.${event.action}`,
      detail: event.detail || event.deviceId,
      meta: { deviceId: event.deviceId, ok: event.ok },
    });
  }
  return list;
}

export function readWhatsapp() {
  return readCollection('whatsapp', []);
}

export function readNexusEvents() {
  return readCollection('nexus-events', []);
}

export { writeCollection, readCollection };
