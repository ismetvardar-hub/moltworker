/**
 * AŞAMA 7 — SSE canlı olay yayıncısı.
 */

const clients = new Set();

export function broadcast(event) {
  const payload = {
    ...event,
    at: event.at || new Date().toISOString(),
  };
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try {
      res.write(line);
    } catch {
      clients.delete(res);
    }
  }
}

export function addSseClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
  // heartbeat
  const ping = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(ping);
      clients.delete(res);
    }
  }, 25000);
  res.on('close', () => clearInterval(ping));
  broadcast({
    type: 'sse.connected',
    detail: `İzleyici bağlandı (${clients.size} aktif)`,
    actor: 'system',
  });
}

export function sseClientCount() {
  return clients.size;
}
