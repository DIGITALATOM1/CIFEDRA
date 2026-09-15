import { createServer, type IncomingMessage } from 'node:http';
import { ApiError, SunleoStore } from './store.js';
const origins = new Set(['http://localhost:5188', 'http://127.0.0.1:5188']);
async function body(request: IncomingMessage) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new ApiError(415, 'Требуется application/json');
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8192) throw new ApiError(413, 'Слишком большой запрос');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new ApiError(400, 'Некорректный JSON'); }
}
export function createSunleoServer(store: SunleoStore) {
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = request.headers.origin;
    if (origin && origins.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    try {
      if (!/^((localhost|127\.0\.0\.1)(:\d+)?)$/.test(request.headers.host ?? '')) throw new ApiError(403, 'Доступ только через localhost');
      if (origin && !origins.has(origin)) throw new ApiError(403, 'Источник запроса не разрешён');
      if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
      if (request.method === 'GET' && request.url === '/sunleo-api/state') { response.end(JSON.stringify(store.state())); return; }
      if (request.method !== 'POST' || !/^\/sunleo-api\/(days|appointments|appointments\/[a-f0-9-]{36}\/complete)$/.test(request.url ?? '')) throw new ApiError(404, 'Маршрут не найден');
      response.end(JSON.stringify(await store.mutate(request.url!, await body(request))));
    } catch (error) {
      response.statusCode = error instanceof ApiError ? error.status : 500;
      response.end(JSON.stringify({ error: error instanceof ApiError ? error.message : 'Ошибка локального хранилища' }));
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  return server;
}
