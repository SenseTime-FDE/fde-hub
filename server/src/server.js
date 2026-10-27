'use strict';
/**
 * allfde.com 自托管入口：Node 服务负责静态前端、管理后台和表单 API。
 * 默认监听 0.0.0.0:3000，生产由 HOST / PORT 改写；数据使用 SQLite。
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { open } = require('./db');
const { Router } = require('./router');
const { securityHeaders, html, HttpError } = require('./http');
const pages = require('./views/pages');

const PUBLIC = path.resolve(process.env.ALLFDE_STATIC_ROOT || path.join(__dirname, '..', '..'));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.hdr': 'application/octet-stream',
};

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return false; }
  let file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return false;
  let st;
  try { st = fs.statSync(file); } catch { return false; }
  if (st.isDirectory()) {
    file = path.join(file, 'index.html');
    try { st = fs.statSync(file); } catch { return false; }
  }
  if (!st.isFile()) return false;
  const ext = path.extname(file).toLowerCase();
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const longCache = rel.startsWith('/vendor/') || rel.startsWith('/img/');
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', longCache ? 'public, max-age=604800' : 'public, max-age=300');
  if (req.headers['if-none-match'] === etag) { res.writeHead(304); res.end(); return true; }
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size });
  if (req.method === 'HEAD') { res.end(); return true; }
  fs.createReadStream(file).pipe(res);
  return true;
}

function createServer() {
  open();
  const router = new Router();
  if (process.env.ALLFDE_STATIC_SITE === '1') require('./routes/static-api').mount(router);
  else require('./routes/public').mount(router);
  require('./routes/admin').mount(router);

  return http.createServer(async (req, res) => {
    securityHeaders(res);
    const url = new URL(req.url, 'http://localhost');
    try {
      const m = router.match(req.method, url.pathname);
      if (m) return await m.handler(req, res, m.params, url);
      if (serveStatic(req, res, url.pathname)) return;
      html(res, pages.notFound(), 404);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(new Date().toISOString(), req.method, url.pathname, e);
      if (res.headersSent) { res.end(); return; }
      html(res, pages.errorPage(status, status === 500 ? '服务暂时不可用，请稍后再试' : e.message), status);
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  createServer().listen(port, host, () => console.log(`allfde 网站已启动：http://${host === '0.0.0.0' ? 'localhost' : host}:${port}  （后台 /admin）`));
}

module.exports = { createServer };
