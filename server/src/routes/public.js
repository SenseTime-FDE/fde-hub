'use strict';
/**
 * 公开路由：页面 ＋ 五类表单（预约演示 · 伙伴申请 · 技术交流入群 · 活动报名 · 简历投递）；活动封面图 /media/events/。
 * 表单：访客 CSRF、蜜罐字段、按 IP 限流、服务端校验；成功后 303 跳转到感谢页（PRG）。
 */
const fs = require('node:fs');
const path = require('node:path');
const { all, get, insert, now, UPLOADS, EVENT_COVERS } = require('../db');
const { html, redirect, parseForm, HttpError, allow, clientIp, token } = require('../http');
const { visitorToken, checkVisitorToken } = require('../auth');
const V = require('../views/pages');
const C = require('../content');

const PHONE = /^[0-9+()\-\s]{6,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const clean = (v, max = 200) => String(Array.isArray(v) ? v.join('、') : (v ?? '')).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

function validate(f, rules) {
  const value = {}; const errors = {};
  for (const [k, r] of Object.entries(rules)) {
    const v = clean(f[k], r.max || 200);
    value[k] = v;
    if (r.required && !v) errors[k] = '请填写此项';
    else if (v && r.type === 'phone' && !PHONE.test(v)) errors[k] = '请填写正确的手机号';
    else if (v && r.type === 'email' && !EMAIL.test(v)) errors[k] = '请填写正确的邮箱';
    else if (v && r.oneOf && !r.oneOf.includes(v)) errors[k] = '请选择列表中的选项';
  }
  if (f.consent !== '1') errors.consent = '请先阅读并同意隐私说明';
  return { value, errors };
}
function guard(req, f, bucket) {
  checkVisitorToken(req, f._t);
  if (!allow(`${bucket}:${clientIp(req)}`, 8, 10 * 60 * 1000)) throw new HttpError(429, '提交太频繁，请稍后再试');
  return !clean(f.website);   // 蜜罐有值：当作机器人，静默丢弃
}
const has = (e) => Object.keys(e).length > 0;

/* 已发布活动：按开始时间分即将举办 / 往期 */
function publishedEvents(kind) {
  const rows = all("SELECT * FROM event WHERE status = 'published' ORDER BY starts_at ASC");
  const t = now();
  const list = kind ? rows.filter((e) => e.kind === kind) : rows;
  return { upcoming: list.filter((e) => (e.ends_at || e.starts_at) >= t), past: list.filter((e) => (e.ends_at || e.starts_at) < t).reverse() };
}

const RESUME_TYPES = { pdf: (b) => b.slice(0, 4).toString() === '%PDF', docx: (b) => b[0] === 0x50 && b[1] === 0x4b, doc: (b) => b.slice(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])) };
const MAX_RESUME = 10 * 1024 * 1024;

function mount(router) {
  router.get('/', (req, res) => {
    const { upcoming } = publishedEvents();
    html(res, V.home({ events: upcoming.slice(0, 3) }));
  });
  router.get('/solutions', (req, res) => html(res, V.solutions()));
  router.get('/cloud-maas', (req, res) => html(res, V.cloudMaas()));
  router.get('/token-plan', (req, res) => redirect(res, '/cloud-maas#token-plan', 301));   // v1.2：Token Plan 入口并入云端 MaaS

  /* 活动封面图：文件名随机，只认安全文件名 */
  router.get('/media/events/:file', (req, res, p) => {
    const ext = path.extname(p.file).slice(1).toLowerCase();
    const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext];
    const file = path.join(EVENT_COVERS, p.file);
    if (!type || !/^[\w.-]+$/.test(p.file) || !fs.existsSync(file)) return html(res, V.notFound(), 404);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  });

  /* 技术交流入群：存进 lead 表，source = community */
  const communityRules = {
    name: { required: true, max: 40 }, company: { required: true, max: 120 }, title: { max: 40, oneOf: C.COMMUNITY.roleOptions },
    phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 }, city: { max: 40 }, interest: { max: 400 }, message: { max: 2000 },
  };
  router.get('/community', (req, res) => html(res, V.community({ csrf: visitorToken(req, res) })));
  router.post('/community', async (req, res) => {
    const { fields: f } = await parseForm(req);
    const real = guard(req, f, 'community');
    const interest = [].concat(f.interest || []).map((x) => clean(x, 60)).filter((x) => C.COMMUNITY.topicOptions.includes(x));
    const { value, errors } = validate({ ...f, interest }, communityRules);
    value.interest = interest;
    if (has(errors)) return html(res, V.community({ csrf: visitorToken(req, res), value, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    if (real) insert('lead', { ...value, interest: interest.join('、'), source: 'community', status: 'new', created_at: now() });
    redirect(res, '/thanks/community');
  });
  router.get('/solutions/:slug', (req, res, p) => {
    const out = V.product(p.slug);
    if (!out) return html(res, V.notFound(), 404);
    html(res, out);
  });

  /* 预约演示 */
  const leadRules = {
    name: { required: true, max: 40 }, company: { required: true, max: 120 }, title: { max: 40 },
    phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 }, city: { max: 40 },
    industry: { max: 40, oneOf: C.CONTACT.industries }, interest: { max: 400 }, message: { max: 2000 }, source: { max: 40 },
  };
  router.get('/contact', (req, res, p, url) => html(res, V.contact({ csrf: visitorToken(req, res), value: { source: clean(url.searchParams.get('from'), 40) } })));
  router.post('/contact', async (req, res) => {
    const { fields: f } = await parseForm(req);
    const real = guard(req, f, 'lead');
    const interest = [].concat(f.interest || []).map((x) => clean(x, 60)).filter((x) => C.CONTACT.interests.includes(x));
    const { value, errors } = validate({ ...f, interest }, leadRules);
    value.interest = interest;
    if (has(errors)) return html(res, V.contact({ csrf: visitorToken(req, res), value, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    if (real) insert('lead', { ...value, interest: interest.join('、'), status: 'new', created_at: now() });
    redirect(res, '/thanks/lead');
  });

  /* 加入生态：伙伴身份可多选（至少一种），「有客户 / 有产品 / 有团队」可多选 */
  const partnerRules = {
    company: { required: true, max: 120 }, contact: { required: true, max: 40 },
    title: { max: 40 }, phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 }, city: { max: 40 },
    team_size: { oneOf: C.PARTNER.sizeOptions }, industries: { max: 200 }, intro: { max: 2000 },
  };
  const pick = (v, options) => [...new Set([].concat(v || []).map((x) => clean(x, 60)).filter((x) => options.includes(x)))];
  router.get('/partners', (req, res) => html(res, V.partners({ csrf: visitorToken(req, res) })));
  router.post('/partners', async (req, res) => {
    const { fields: f } = await parseForm(req);
    const real = guard(req, f, 'partner');
    const { value, errors } = validate(f, partnerRules);
    const types = pick(f.partner_type, C.PARTNER.typeOptions); const haves = pick(f.has_what, C.PARTNER.haveOptions);
    value.partner_type = types; value.has_what = haves;
    if (!types.length) errors.partner_type = '请至少选择一种伙伴身份';
    if (has(errors)) return html(res, V.partners({ csrf: visitorToken(req, res), value, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    if (real) insert('partner_app', { ...value, partner_type: types.join('、'), has_what: haves.join('、'), status: 'new', created_at: now() });
    redirect(res, '/thanks/partner');
  });

  /* 市场活动 */
  router.get('/events', (req, res, p, url) => {
    const kind = clean(url.searchParams.get('kind'), 20);
    html(res, V.events({ ...publishedEvents(C.EVENT_KINDS.includes(kind) ? kind : ''), kind: C.EVENT_KINDS.includes(kind) ? kind : '' }));
  });
  const eventCtx = (slug) => {
    const ev = get("SELECT * FROM event WHERE slug = ? AND status = 'published'", slug);
    if (!ev) return null;
    const past = (ev.ends_at || ev.starts_at) < now();
    const n = get("SELECT COUNT(*) AS n FROM event_reg WHERE event_id = ? AND status != 'cancelled'", ev.id).n;
    return { ev, past, full: !!ev.capacity && n >= ev.capacity };
  };
  router.get('/events/:slug', (req, res, p) => {
    const ctx = eventCtx(p.slug);
    if (!ctx) return html(res, V.notFound(), 404);
    html(res, V.eventDetail({ ...ctx, csrf: visitorToken(req, res) }));
  });
  const regRules = { name: { required: true, max: 40 }, company: { required: true, max: 120 }, title: { max: 40 }, phone: { required: true, type: 'phone', max: 20 }, email: { type: 'email', max: 120 } };
  router.post('/events/:slug', async (req, res, p) => {
    const ctx = eventCtx(p.slug);
    if (!ctx) return html(res, V.notFound(), 404);
    const { fields: f } = await parseForm(req);
    const real = guard(req, f, 'event');
    if (ctx.past || !ctx.ev.reg_open || ctx.full) throw new HttpError(409, '该活动当前不能报名');
    const { value, errors } = validate(f, regRules);
    if (has(errors)) return html(res, V.eventDetail({ ...ctx, csrf: visitorToken(req, res), value, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    if (real) {
      const dup = get("SELECT id FROM event_reg WHERE event_id = ? AND phone = ? AND status != 'cancelled'", ctx.ev.id, value.phone);
      if (!dup) insert('event_reg', { event_id: ctx.ev.id, ...value, status: 'new', created_at: now() });
    }
    redirect(res, '/thanks/event');
  });

  /* 人才招聘 */
  router.get('/careers', (req, res, p, url) => {
    const q = { q: clean(url.searchParams.get('q'), 40), kind: clean(url.searchParams.get('kind'), 20), city: clean(url.searchParams.get('city'), 20) };
    let jobs = all("SELECT * FROM job WHERE status = 'published' ORDER BY sort, id DESC");
    const allJobs = jobs;
    if (q.kind) jobs = jobs.filter((j) => j.kind === q.kind);
    if (q.city) jobs = jobs.filter((j) => j.city === q.city);
    if (q.q) { const k = q.q.toLowerCase(); jobs = jobs.filter((j) => `${j.title} ${j.team || ''} ${j.summary || ''} ${j.duties || ''} ${j.requirements || ''}`.toLowerCase().includes(k)); }
    html(res, V.careers({ jobs, q, allJobs }));
  });
  const jobById = (id) => (/^\d+$/.test(id) ? get("SELECT * FROM job WHERE id = ? AND status = 'published'", Number(id)) : null);
  router.get('/careers/:id', (req, res, p) => {
    const job = jobById(p.id);
    if (!job) return html(res, V.notFound(), 404);
    html(res, V.jobDetail({ job, csrf: visitorToken(req, res) }));
  });
  const appRules = { name: { required: true, max: 40 }, phone: { required: true, type: 'phone', max: 20 }, email: { required: true, type: 'email', max: 120 }, years: { oneOf: C.CAREERS.yearsOptions }, city: { max: 40 }, message: { max: 1000 } };
  router.post('/careers/:id', async (req, res, p) => {
    const job = jobById(p.id);
    if (!job) return html(res, V.notFound(), 404);
    const { fields: f, files } = await parseForm(req, { fileLimit: MAX_RESUME + 64 * 1024 });
    const real = guard(req, f, 'job');
    const { value, errors } = validate(f, appRules);
    const file = files.find((x) => x.field === 'resume');
    let ext = '';
    if (!file) errors.resume = '请上传简历附件';
    else {
      ext = path.extname(file.filename).slice(1).toLowerCase();
      if (!RESUME_TYPES[ext] || !RESUME_TYPES[ext](file.data)) errors.resume = '只支持 PDF、Word 格式的简历';
      else if (file.data.length > MAX_RESUME) errors.resume = '简历附件不能超过 10 MB';
    }
    if (has(errors)) return html(res, V.jobDetail({ job, csrf: visitorToken(req, res), value, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    if (real) {
      fs.mkdirSync(UPLOADS, { recursive: true });
      const stored = `${Date.now()}_${token(12)}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS, stored), file.data, { mode: 0o600 });
      insert('job_app', { job_id: job.id, ...value, resume_file: stored, resume_name: clean(path.basename(file.filename), 120), status: 'new', created_at: now() });
    }
    redirect(res, '/thanks/job');
  });

  router.get('/thanks/:kind', (req, res, p) => html(res, V.thanks(p.kind)));
  router.get('/privacy', (req, res) => html(res, V.privacy()));
  router.get('/sitemap.xml', (req, res) => {
    const origin = process.env.ALLFDE_ORIGIN || 'https://allfde.com';
    const paths = ['/', '/solutions', ...Object.keys(C.PRODUCTS).map((k) => `/solutions/${k}`), '/cloud-maas', '/partners', '/events', '/careers', '/community', '/contact', '/privacy',
      ...all("SELECT slug FROM event WHERE status = 'published'").map((e) => `/events/${encodeURIComponent(e.slug)}`),
      ...all("SELECT id FROM job WHERE status = 'published'").map((j) => `/careers/${j.id}`)];
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`);
  });
  router.get('/healthz', (req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok'); });
}

module.exports = { mount };
