'use strict';

/**
 * 静态前端的同源 API：当前页面继续由仓库根目录提供，提交数据由 Node + SQLite 接收。
 * 公开页面尚未默认绑定这些表单；接口先固定路径、字段和 CSRF 约定，后续页面接入无需再改存储层。
 */
const fs = require('node:fs');
const path = require('node:path');
const { all, get, insert, now, UPLOADS } = require('../db');
const { json, parseForm, HttpError, allow, clientIp, token } = require('../http');
const { visitorToken, checkVisitorToken } = require('../auth');

const PHONE = /^[0-9+()\-\s]{6,20}$/;
const clean = (v, max = 200) => String(Array.isArray(v) ? v.join('、') : (v ?? ''))
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const pick = (v, options, max = 60) => [...new Set([].concat(v || []).map((x) => clean(x, max)).filter((x) => options.includes(x)))];

// Keep the pattern readable in source while avoiding an accidental email literal in docs/search snippets.
const emailPattern = /^[^\s@]{1,64}[^\s@]{0}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

function fieldsFor(f, rules) {
  const value = {}; const errors = {};
  for (const [key, rule] of Object.entries(rules)) {
    const valueForKey = clean(f[key], rule.max || 200);
    value[key] = valueForKey;
    if (rule.required && !valueForKey) errors[key] = '请填写此项';
    else if (valueForKey && rule.type === 'phone' && !PHONE.test(valueForKey)) errors[key] = '请填写正确的手机号';
    else if (valueForKey && rule.type === 'email' && !emailPattern.test(valueForKey)) errors[key] = '请填写正确的邮箱';
  }
  return { value, errors };
}

function guard(req, f, bucket) {
  checkVisitorToken(req, f._t);
  if (!allow(`${bucket}:${clientIp(req)}`, 8, 10 * 60 * 1000)) throw new HttpError(429, '提交太频繁，请稍后再试');
  if (clean(f.website)) return false;
  return true;
}

function result(res, data, status = 200) { return json(res, { ok: status < 400, ...data }, status); }
function bad(res, errors, status = 422) { return result(res, { errors }, status); }

async function form(req, opts) {
  const parsed = await parseForm(req, opts);
  return { fields: parsed.fields || {}, files: parsed.files || [] };
}

function mount(router) {
  router.get('/healthz', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('ok');
  });
  router.get('/api/csrf', (req, res) => result(res, { csrf: visitorToken(req, res) }));
  router.get('/api/status', (req, res) => result(res, {
    service: 'allfde', version: process.env.ALLFDE_RELEASE || 'selfhost-dev', storage: 'sqlite', static: true,
  }));

  router.post('/api/contact', async (req, res) => {
    const { fields: f } = await form(req);
    if (!guard(req, f, 'contact')) return result(res, { accepted: true });
    const { value, errors } = fieldsFor(f, {
      name: { required: true, max: 40 }, company: { required: true, max: 120 }, title: { max: 40 },
      phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 }, city: { max: 40 },
      interest: { max: 400 }, message: { max: 2000 },
    });
    if (Object.keys(errors).length) return bad(res, errors);
    insert('lead', { ...value, source: 'contact', status: 'new', created_at: now() });
    return result(res, { accepted: true }, 201);
  });

  router.post('/api/community', async (req, res) => {
    const { fields: f } = await form(req);
    if (!guard(req, f, 'community')) return result(res, { accepted: true });
    const { value, errors } = fieldsFor(f, {
      name: { required: true, max: 40 }, company: { required: true, max: 120 }, title: { max: 40 },
      phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 }, city: { max: 40 },
      interest: { max: 400 }, message: { max: 2000 },
    });
    if (Object.keys(errors).length) return bad(res, errors);
    insert('lead', { ...value, source: 'community', status: 'new', created_at: now() });
    return result(res, { accepted: true }, 201);
  });

  router.post('/api/partners', async (req, res) => {
    const { fields: f } = await form(req);
    if (!guard(req, f, 'partner')) return result(res, { accepted: true });
    const { value, errors } = fieldsFor(f, {
      company: { required: true, max: 120 }, contact: { required: true, max: 40 }, title: { max: 40 },
      phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 }, city: { max: 40 },
      team_size: { max: 40 }, industries: { max: 200 }, intro: { max: 2000 },
    });
    const types = pick(f.partner_type, ['渠道伙伴', '生态伙伴（ISV）', '服务伙伴']);
    if (!types.length) errors.partner_type = '请至少选择一种伙伴身份';
    if (Object.keys(errors).length) return bad(res, errors);
    insert('partner_app', { ...value, partner_type: types.join('、'), has_what: '', status: 'new', created_at: now() });
    return result(res, { accepted: true }, 201);
  });

  router.post('/api/events/:slug', async (req, res, p) => {
    const event = get("SELECT * FROM event WHERE slug = ? AND status = 'published'", p.slug);
    if (!event) return result(res, { error: '活动不存在或未开放报名' }, 404);
    const { fields: f } = await form(req);
    if (!guard(req, f, 'event')) return result(res, { accepted: true });
    const { value, errors } = fieldsFor(f, {
      name: { required: true, max: 40 }, company: { required: true, max: 120 }, title: { max: 40 },
      phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 },
    });
    if (Object.keys(errors).length) return bad(res, errors);
    const duplicate = get("SELECT id FROM event_reg WHERE event_id = ? AND phone = ? AND status != 'cancelled'", event.id, value.phone);
    if (!duplicate) insert('event_reg', { event_id: event.id, ...value, status: 'new', created_at: now() });
    return result(res, { accepted: true }, 201);
  });

  router.post('/api/careers/:id', async (req, res, p) => {
    const job = /^\d+$/.test(p.id) ? get("SELECT * FROM job WHERE id = ? AND status = 'published'", Number(p.id)) : null;
    if (!job) return result(res, { error: '职位不存在或未开放投递' }, 404);
    const { fields: f, files } = await form(req, { fileLimit: 10 * 1024 * 1024 + 64 * 1024 });
    if (!guard(req, f, 'job')) return result(res, { accepted: true });
    const { value, errors } = fieldsFor(f, {
      name: { required: true, max: 40 }, phone: { required: true, type: 'phone', max: 20 },
      email: { required: true, type: 'email', max: 120 }, city: { max: 40 }, years: { max: 40 }, message: { max: 1000 },
    });
    const file = files.find((x) => x.field === 'resume');
    const ext = file ? path.extname(file.filename).slice(1).toLowerCase() : '';
    const valid = file && ['pdf', 'doc', 'docx'].includes(ext) && file.data.length <= 10 * 1024 * 1024;
    if (!valid) errors.resume = '请上传不超过 10 MB 的 PDF 或 Word 简历';
    if (Object.keys(errors).length) return bad(res, errors);
    fs.mkdirSync(UPLOADS, { recursive: true });
    const stored = `${Date.now()}_${token(12)}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS, stored), file.data, { mode: 0o600 });
    insert('job_app', { job_id: job.id, ...value, resume_file: stored, resume_name: clean(path.basename(file.filename), 120), status: 'new', created_at: now() });
    return result(res, { accepted: true }, 201);
  });
}

module.exports = { mount };
