'use strict';
/**
 * HTTP 小工具：转义、Cookie、请求体（urlencoded / JSON / multipart）、响应、安全头、限流。零依赖。
 */
const crypto = require('node:crypto');

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const token = (n = 24) => crypto.randomBytes(n).toString('base64url');

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path || '/'}`, 'SameSite=Lax'];
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  if (opts.maxAge != null) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  if (process.env.ALLFDE_SECURE_COOKIE === '1') parts.push('Secure');
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [].concat(prev || [], parts.join('; ')));
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, '提交内容过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function addField(fields, k, v) {
  if (!(k in fields)) fields[k] = v;
  else fields[k] = [].concat(fields[k], v);
}

/** multipart/form-data：返回 { fields, files }；files 为 [{ field, filename, type, data }] */
function parseMultipart(buf, boundary) {
  const fields = {}; const files = [];
  const delim = Buffer.from(`--${boundary}`);
  let pos = buf.indexOf(delim);
  while (pos !== -1) {
    pos += delim.length;
    if (buf.slice(pos, pos + 2).toString() === '--') break;   // 结束
    if (buf.slice(pos, pos + 2).toString() === '\r\n') pos += 2;
    const headEnd = buf.indexOf('\r\n\r\n', pos);
    if (headEnd === -1) break;
    const head = buf.slice(pos, headEnd).toString('utf8');
    const next = buf.indexOf(delim, headEnd + 4);
    if (next === -1) break;
    const data = buf.slice(headEnd + 4, next - 2);   // 去掉分隔前的 \r\n
    const name = /name="([^"]*)"/i.exec(head)?.[1];
    const filename = /filename="([^"]*)"/i.exec(head)?.[1];
    const type = /content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim() || 'application/octet-stream';
    if (name != null) {
      if (filename != null) { if (filename) files.push({ field: name, filename, type, data }); }
      else addField(fields, name, data.toString('utf8'));
    }
    pos = next;
  }
  return { fields, files };
}

async function parseForm(req, { limit = 64 * 1024, fileLimit = 0 } = {}) {
  const type = String(req.headers['content-type'] || '');
  if (type.startsWith('multipart/form-data')) {
    if (!fileLimit) throw new HttpError(415, '不支持的提交方式');
    const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(type);
    if (!boundary) throw new HttpError(400, '提交格式有误');
    const buf = await readBody(req, fileLimit + limit);
    return parseMultipart(buf, boundary[1] || boundary[2]);
  }
  const buf = await readBody(req, limit);
  if (type.startsWith('application/json')) {
    try { return { fields: JSON.parse(buf.toString('utf8') || '{}'), files: [] }; } catch { throw new HttpError(400, '提交格式有误'); }
  }
  const fields = {};
  for (const [k, v] of new URLSearchParams(buf.toString('utf8'))) addField(fields, k, v);   // 同名字段（多选）收成数组
  return { fields, files: [] };
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'", "img-src 'self' data:", "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'", "connect-src 'self'", "font-src 'self' data:",
    "frame-ancestors 'self'", "base-uri 'self'", "form-action 'self'",
  ].join('; '));
}

function html(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function json(res, obj, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function redirect(res, to, status = 303) { res.writeHead(status, { Location: to, 'Cache-Control': 'no-store' }); res.end(); }

/** 内存限流：key → 时间戳队列；超限返回 false */
const buckets = new Map();
function allow(key, max, windowMs) {
  const t = Date.now();
  const q = (buckets.get(key) || []).filter((x) => t - x < windowMs);
  if (q.length >= max) { buckets.set(key, q); return false; }
  q.push(t); buckets.set(key, q);
  if (buckets.size > 20000) buckets.clear();
  return true;
}
/** 只读：窗口内已记录的次数 */
function hits(key, windowMs) { const t = Date.now(); return (buckets.get(key) || []).filter((x) => t - x < windowMs).length; }
const clientIp = (req) => (process.env.ALLFDE_TRUST_PROXY === '1' && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';

module.exports = { esc, token, parseCookies, setCookie, HttpError, parseForm, parseMultipart, securityHeaders, html, json, redirect, allow, hits, clientIp };
