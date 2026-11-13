const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIST_DIR = path.join(ROOT_DIR, 'client', 'dist');
const PORT = Number(process.env.PORT || 8787);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MODEL_LIST_TTL_MS = Number(process.env.MODEL_LIST_TTL_MS || 12 * 60 * 60 * 1000);
const rateBuckets = new Map();
const modelListCache = {
  data: null,
  expiresAt: 0
};

if (typeof fetch !== 'function') {
  console.error('[proxy] Node.js 18+ is required for fetch support.');
  process.exit(1);
}

const sanitizeEnvValue = (value) => {
  let v = String(value || '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")) || (v.startsWith('`') && v.endsWith('`'))) {
    v = v.slice(1, -1);
  }
  return v.trim();
};

const readEnvValue = (key) => {
  if (process.env[key]) return sanitizeEnvValue(process.env[key]);
  const envPaths = [
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, 'client', '.env')
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const name = trimmed.slice(0, eqIndex).trim();
      if (name !== key) continue;
      const raw = trimmed.slice(eqIndex + 1).trim();
      return sanitizeEnvValue(raw);
    }
  }
  return '';
};

const LOG_DIR = readEnvValue('LOG_DIR');

const API_KEY =
  readEnvValue('API_KEY') ||
  readEnvValue('GEMINI_API_KEY') ||
  readEnvValue('GOOGLE_API_KEY') ||
  readEnvValue('GOOGLE_GENERATIVE_AI_API_KEY');

const DEFAULT_MODEL =
  readEnvValue('MODEL') ||
  readEnvValue('GEMINI_MODEL') ||
  'gemini-2.5-flash';

const DEFAULT_VISION_MODEL =
  readEnvValue('VISION_MODEL') ||
  readEnvValue('GEMINI_VISION_MODEL') ||
  DEFAULT_MODEL ||
  'gemini-2.5-flash';

const jsonResponse = (res, status, payload, extraHeaders = {}) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    ...extraHeaders
  });
  res.end(body);
};

const readJsonBody = (req, maxBytes = 2 * 1024 * 1024) => new Promise((resolve, reject) => {
  let size = 0;
  const chunks = [];
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxBytes) {
      reject(new Error('Payload too large'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    try {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      resolve(JSON.parse(raw));
    } catch (err) {
      reject(err);
    }
  });
  req.on('error', reject);
});

const isRateLimited = (ip) => {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  bucket.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX - bucket.count);
  return { limited: bucket.count > RATE_LIMIT_MAX, remaining, resetAt: bucket.resetAt };
};

const sanitizeModelName = (value) => String(value || '').trim();
const MODEL_ALIASES = {
  'gemini-2.5-flash-preview-09-2025': 'gemini-2.5-flash'
};
const normalizeModelName = (value) => MODEL_ALIASES[value] || value;
const isValidModelName = (value) => /^[a-zA-Z0-9_.:-]+$/.test(value);

const getModelList = async () => {
  const now = Date.now();
  if (modelListCache.data && now < modelListCache.expiresAt) {
    return modelListCache.data;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }
  const data = JSON.parse(text);
  modelListCache.data = data;
  modelListCache.expiresAt = now + MODEL_LIST_TTL_MS;
  return data;
};

const handleModelsRequest = async (req, res) => {
  if (!API_KEY) {
    return jsonResponse(res, 500, { error: 'API_KEY is missing on the server.' });
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });
    return res.end();
  }
  if (req.method !== 'GET') {
    return jsonResponse(res, 405, { error: 'Method not allowed.' });
  }
  try {
    const data = await getModelList();
    return jsonResponse(res, 200, data);
  } catch (err) {
    return jsonResponse(res, 502, { error: 'Failed to fetch models.' });
  }
};

const appendLogEntry = (entry) => {
  if (!LOG_DIR) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const filePath = path.join(LOG_DIR, `errors-${day}.log`);
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    console.warn('[log] Failed to write error log:', err);
  }
};

const sanitizeLogPayload = (payload) => {
  const safe = {};
  if (!payload || typeof payload !== 'object') return safe;
  if (payload.type) safe.type = String(payload.type).slice(0, 64);
  if (payload.message) safe.message = String(payload.message).slice(0, 4000);
  if (payload.source) safe.source = String(payload.source).slice(0, 500);
  if (payload.href) safe.href = String(payload.href).slice(0, 800);
  if (payload.userAgent) safe.userAgent = String(payload.userAgent).slice(0, 500);
  if (payload.stack) safe.stack = String(payload.stack).slice(0, 8000);
  if (payload.lineno !== undefined) safe.lineno = Number(payload.lineno) || 0;
  if (payload.colno !== undefined) safe.colno = Number(payload.colno) || 0;
  if (payload.ts) safe.ts = String(payload.ts).slice(0, 64);
  return safe;
};

const handleLogRequest = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    return res.end();
  }
  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Method not allowed.' });
  }

  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const rate = isRateLimited(ip);
  const rateHeaders = {
    'X-RateLimit-Limit': RATE_LIMIT_MAX,
    'X-RateLimit-Remaining': rate.remaining,
    'X-RateLimit-Reset': Math.ceil(rate.resetAt / 1000)
  };
  if (rate.limited) {
    return jsonResponse(res, 429, { error: 'Rate limit exceeded.' }, rateHeaders);
  }

  let body;
  try {
    body = await readJsonBody(req, 64 * 1024);
  } catch (err) {
    return jsonResponse(res, 400, { error: 'Invalid JSON body.' }, rateHeaders);
  }

  const safePayload = sanitizeLogPayload(body);
  const entry = {
    ts: new Date().toISOString(),
    ip,
    ua: req.headers['user-agent'] || '',
    payload: safePayload
  };

  appendLogEntry(entry);
  console.error('[client-error]', entry);

  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...rateHeaders
  });
  return res.end();
};

const sendProxyRequest = async (req, res, options) => {
  if (!API_KEY) {
    return jsonResponse(res, 500, { error: 'API_KEY is missing on the server.' });
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }
  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Method not allowed.' });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const rate = isRateLimited(ip);
  const rateHeaders = {
    'X-RateLimit-Limit': RATE_LIMIT_MAX,
    'X-RateLimit-Remaining': rate.remaining,
    'X-RateLimit-Reset': Math.ceil(rate.resetAt / 1000)
  };
  if (rate.limited) {
    return jsonResponse(res, 429, { error: 'Rate limit exceeded.' }, rateHeaders);
  }

  const rawModel = sanitizeModelName(url.searchParams.get('model') || options.defaultModel);
  const model = normalizeModelName(rawModel);
  if (!model) {
    return jsonResponse(res, 400, { error: 'Missing model.' }, rateHeaders);
  }
  if (!isValidModelName(model)) {
    return jsonResponse(res, 400, { error: 'Invalid model name.' }, rateHeaders);
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return jsonResponse(res, 400, { error: 'Invalid JSON body.' }, rateHeaders);
  }

  const upstreamUrl = `https://generativelanguage.googleapis.com/${options.apiVersion}/models/${model}:${options.method}?key=${API_KEY}`;
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const responseText = await upstreamResponse.text();
    res.writeHead(upstreamResponse.status, {
      'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      ...rateHeaders
    });
    res.end(responseText);
  } catch (err) {
    jsonResponse(res, 502, { error: 'Proxy request failed.' }, rateHeaders);
  }
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.traineddata': 'application/octet-stream'
};

const staticRoots = () => (fs.existsSync(CLIENT_DIST_DIR) ? [CLIENT_DIST_DIR] : []);

const resolveStaticPath = (baseDir, requestPath) => {
  const resolvedPath = path.join(baseDir, requestPath);
  if (!resolvedPath.startsWith(baseDir)) return null;
  try {
    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) return null;
    return resolvedPath;
  } catch (err) {
    return null;
  }
};

const serveStatic = (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === '/') filePath = '/index.html';
  const segments = filePath.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.') || seg === 'server' || seg === 'client')) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const roots = staticRoots();
  if (!roots.length) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Client build not found. Run "npm --prefix client run build" first.');
  }
  let resolvedPath = null;
  for (const baseDir of roots) {
    resolvedPath = resolveStaticPath(baseDir, filePath);
    if (resolvedPath) break;
  }

  if (!resolvedPath && !path.extname(filePath)) {
    for (const baseDir of roots) {
      resolvedPath = resolveStaticPath(baseDir, '/index.html');
      if (resolvedPath) break;
    }
  }

  if (!resolvedPath) {
    res.writeHead(404);
    return res.end('Not Found');
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(resolvedPath).pipe(res);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/gemini') {
    return sendProxyRequest(req, res, {
      apiVersion: 'v1beta',
      method: 'generateContent',
      defaultModel: DEFAULT_MODEL
    });
  }
  if (url.pathname === '/api/log') {
    return handleLogRequest(req, res);
  }
  if (url.pathname === '/api/models') {
    return handleModelsRequest(req, res);
  }
  if (url.pathname === '/api/gemini/vision') {
    return sendProxyRequest(req, res, {
      apiVersion: 'v1beta',
      method: 'generateContent',
      defaultModel: DEFAULT_VISION_MODEL
    });
  }
  if (url.pathname === '/api/health') {
    return jsonResponse(res, 200, { ok: true });
  }
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`[proxy] running on http://localhost:${PORT}`);
});
