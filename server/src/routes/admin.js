'use strict';
/**
 * 管理后台路由。每个处理函数先过 need(perm)：未登录跳登录页，无权限 403。所有 POST 校验会话 CSRF（字段 _c）。
 */
const fs = require('node:fs');
const path = require('node:path');
const { all, get, insert, update, run, now, audit, UPLOADS, EVENT_COVERS } = require('../db');
const { token } = require('../http');
const { html, redirect, parseForm, HttpError, allow, hits, clientIp } = require('../http');
const A = require('../auth');
const V = require('../views/admin');
const C = require('../content');

const FLASH = { saved: '已保存', created: '已创建', password: '密码已修改' };
const flashOf = (url) => FLASH[url.searchParams.get('ok')] || '';
const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const intOrNull = (v) => (v === '' || v == null ? null : (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null));
const numId = (s) => (/^\d+$/.test(String(s)) ? Number(s) : 0);

/** datetime-local（北京时间）→ ISO */
function fromLocal(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 8, +m[5])).toISOString();
}

/** CSV：UTF-8 BOM（Excel 直接打开不乱码）；以 = + - @ 开头的值前置单引号，防公式注入 */
function csv(res, filename, head, rows) {
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`, 'Cache-Control': 'no-store' });
  res.end(body);
}

function mount(router) {
  /** 包装：鉴权 ＋ 权限 ＋ POST 的 CSRF */
  const need = (perm, fn, opts = {}) => async (req, res, p, url) => {
    const sess = A.current(req);
    if (!sess) return redirect(res, `/admin/login?next=${encodeURIComponent(url.pathname)}`);
    if (perm && !A.can(sess.user, perm)) return html(res, V.denied(sess), 403);
    let form = null;
    if (req.method === 'POST') {
      form = await parseForm(req, { limit: 256 * 1024, fileLimit: opts.fileLimit || 0 });
      A.checkSessionCsrf(sess, form.fields._c);
    }
    return fn({ req, res, p, url, sess, f: form ? form.fields : {}, files: form ? form.files : [] });
  };
  /** 活动封面：只收 JPG / PNG / WebP（校验文件头），5 MB 以内；返回存储文件名或 null；格式不对抛 400 */
  const COVER_MAX = 5 * 1024 * 1024;
  const COVER_TYPES = { jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, png: (b) => b.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), webp: (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' };
  function saveCover(files) {
    const file = files.find((x) => x.field === 'cover');
    if (!file || !file.data.length) return null;
    let ext = path.extname(file.filename).slice(1).toLowerCase(); if (ext === 'jpeg') ext = 'jpg';
    if (!COVER_TYPES[ext] || !COVER_TYPES[ext](file.data)) throw new HttpError(400, '封面只支持 JPG、PNG、WebP 格式');
    if (file.data.length > COVER_MAX) throw new HttpError(400, '封面图不能超过 5 MB');
    fs.mkdirSync(EVENT_COVERS, { recursive: true });
    const name = `${Date.now()}_${token(10)}.${ext}`;
    fs.writeFileSync(path.join(EVENT_COVERS, name), file.data, { mode: 0o644 });
    return name;
  }

  /* 登录 / 退出 */
  router.get('/admin/login', (req, res) => {
    if (A.current(req)) return redirect(res, '/admin');
    html(res, V.login({}));
  });
  router.post('/admin/login', async (req, res, p, url) => {
    const { fields: f } = await parseForm(req);
    const ipKey = `loginfail:${clientIp(req)}`; const WINDOW = 15 * 60 * 1000;   // 同一 IP 15 分钟内失败 10 次即暂停（成功登录不计）
    if (hits(ipKey, WINDOW) >= 10) return html(res, V.login({ error: '尝试次数过多，请 15 分钟后再试', account: clean(f.account, 60) }), 429);
    try {
      const sid = A.login(f.account, f.password);
      A.setSessionCookie(res, sid);
      const next = url.searchParams.get('next');
      redirect(res, next && /^\/admin(\/[\w\-/.]*)?$/.test(next) ? next : '/admin');
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      if (e.status === 401) allow(ipKey, 1e9, WINDOW);   // 记一次失败
      html(res, V.login({ error: e.message, account: clean(f.account, 60) }), e.status);
    }
  });
  router.post('/admin/logout', need(null, ({ req, res }) => { A.logout(req); A.clearSessionCookie(res); redirect(res, '/admin/login'); }));

  /* 概览 */
  router.get('/admin', need(null, ({ res, sess }) => {
    const u = sess.user; const counts = []; const recent = [];
    const c = (sql) => get(sql).n;
    if (A.can(u, 'leads')) {
      counts.push({ label: '预约演示线索', href: '/admin/leads', n: c('SELECT COUNT(*) n FROM lead'), pending: c("SELECT COUNT(*) n FROM lead WHERE status = 'new'") });
      all('SELECT id, name, company, created_at FROM lead ORDER BY id DESC LIMIT 5').forEach((r) => recent.push({ kind: '预约演示', who: r.name, what: r.company, created_at: r.created_at, href: `/admin/leads/${r.id}` }));
    }
    if (A.can(u, 'partners')) {
      counts.push({ label: '伙伴申请', href: '/admin/partners', n: c('SELECT COUNT(*) n FROM partner_app'), pending: c("SELECT COUNT(*) n FROM partner_app WHERE status = 'new'") });
      all('SELECT id, contact, company, created_at FROM partner_app ORDER BY id DESC LIMIT 5').forEach((r) => recent.push({ kind: '伙伴申请', who: r.contact, what: r.company, created_at: r.created_at, href: `/admin/partners/${r.id}` }));
    }
    if (A.can(u, 'events')) {
      counts.push({ label: '活动报名', href: '/admin/events', n: c('SELECT COUNT(*) n FROM event_reg'), pending: c("SELECT COUNT(*) n FROM event_reg WHERE status = 'new'") });
      all('SELECT r.id, r.name, r.company, r.created_at, r.event_id FROM event_reg r ORDER BY r.id DESC LIMIT 5').forEach((r) => recent.push({ kind: '活动报名', who: r.name, what: r.company, created_at: r.created_at, href: `/admin/events/${r.event_id}/regs` }));
    }
    if (A.can(u, 'jobs')) {
      counts.push({ label: '简历投递', href: '/admin/jobs', n: c('SELECT COUNT(*) n FROM job_app'), pending: c("SELECT COUNT(*) n FROM job_app WHERE status = 'new'") });
      all('SELECT a.id, a.name, j.title, a.created_at FROM job_app a JOIN job j ON j.id = a.job_id ORDER BY a.id DESC LIMIT 5').forEach((r) => recent.push({ kind: '简历投递', who: r.name, what: r.title, created_at: r.created_at, href: `/admin/apps/${r.id}` }));
    }
    recent.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    html(res, V.dashboard({ sess, counts, recent: recent.slice(0, 10) }));
  }));

  /* 线索 · 伙伴申请：列表、详情、改状态、导出 */
  const simple = [
    { key: 'leads', table: 'lead', type: 'lead', list: V.leads, detail: V.leadDetail, file: '线索（预约演示与技术交流）',
      head: ['提交时间', '姓名', '公司', '职务', '手机号', '邮箱', '城市', '行业', '感兴趣', '想解决的问题', '来源', '状态', '跟进备注'],
      row: (r) => [r.created_at, r.name, r.company, r.title, r.phone, r.email, r.city, r.industry, r.interest, r.message, r.source, V.STATUS.lead[r.status], r.note] },
    { key: 'partners', table: 'partner_app', type: 'partner_app', list: V.partners, detail: V.partnerDetail, file: '伙伴申请',
      head: ['提交时间', '公司', '伙伴身份', '手里有什么', '联系人', '职务', '手机号', '邮箱', '城市', '团队规模', '深耕行业', '公司与合作设想', '状态', '跟进备注'],
      row: (r) => [r.created_at, r.company, r.partner_type, r.has_what, r.contact, r.title, r.phone, r.email, r.city, r.team_size, r.industries, r.intro, V.STATUS.partner_app[r.status], r.note] },
  ];
  for (const S of simple) {
    /** 按状态筛选；线索另可按来源筛选（community ＝ 技术交流，其余为预约演示） */
    const rowsBy = (status, source) => {
      const where = []; const args = [];
      if (V.STATUS[S.type][status]) { where.push('status = ?'); args.push(status); }
      if (S.key === 'leads' && source === 'community') where.push("source = 'community'");
      if (S.key === 'leads' && source === 'demo') where.push("COALESCE(source, '') != 'community'");
      return all(`SELECT * FROM ${S.table}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC`, ...args);
    };
    router.get(`/admin/${S.key}`, need(S.key, ({ res, sess, url }) => {
      const status = url.searchParams.get('status') || ''; const source = url.searchParams.get('source') || '';
      html(res, S.list({ sess, rows: rowsBy(status, source), status: V.STATUS[S.type][status] ? status : '', source, flash: flashOf(url) }));
    }));
    router.get(`/admin/${S.key}.csv`, need(S.key, ({ res, sess, url }) => {
      audit(sess.user.id, `${S.key}.export`);
      csv(res, `${S.file}_${now().slice(0, 10)}.csv`, S.head, rowsBy(url.searchParams.get('status') || '', url.searchParams.get('source') || '').map(S.row));
    }));
    router.get(`/admin/${S.key}/:id`, need(S.key, ({ res, sess, p, url }) => {
      const row = get(`SELECT * FROM ${S.table} WHERE id = ?`, numId(p.id));
      if (!row) throw new HttpError(404, '记录不存在');
      html(res, S.detail({ sess, row, flash: flashOf(url) }));
    }));
    router.post(`/admin/${S.key}/:id`, need(S.key, ({ res, sess, p, f }) => {
      const row = get(`SELECT id FROM ${S.table} WHERE id = ?`, numId(p.id));
      if (!row) throw new HttpError(404, '记录不存在');
      if (!V.STATUS[S.type][f.status]) throw new HttpError(400, '状态不正确');
      update(S.table, row.id, { status: f.status, note: clean(f.note, 500), updated_at: now() });
      audit(sess.user.id, `${S.key}.update`, String(row.id));
      redirect(res, `/admin/${S.key}/${row.id}?ok=saved`);
    }));
  }

  /* 活动 */
  router.get('/admin/events', need('events', ({ res, sess, url }) => {
    const rows = all("SELECT e.*, (SELECT COUNT(*) FROM event_reg r WHERE r.event_id = e.id AND r.status != 'cancelled') AS regs FROM event e ORDER BY e.starts_at DESC");
    html(res, V.eventsList({ sess, rows, flash: flashOf(url) }));
  }));
  const eventFields = (f) => ({
    title: clean(f.title, 80), slug: clean(f.slug, 60).toLowerCase(), kind: C.EVENT_KINDS.includes(f.kind) ? f.kind : C.EVENT_KINDS[0],
    starts_at: fromLocal(f.starts_at), ends_at: fromLocal(f.ends_at), city: clean(f.city, 40), venue: clean(f.venue, 120),
    capacity: intOrNull(f.capacity) || null, reg_open: f.reg_open === '0' ? 0 : 1, summary: clean(f.summary, 140), body: clean(f.body, 8000),
    status: V.STATUS.event[f.status] ? f.status : 'draft',
  });
  const eventErrors = (row, id) => {
    const e = {};
    if (!row.title) e.title = '请填写活动名称';
    if (!/^[a-z0-9-]{2,60}$/.test(row.slug)) e.slug = '只能用小写英文、数字与短横线，2–60 位';
    else if (get('SELECT id FROM event WHERE slug = ? AND id != ?', row.slug, id || 0)) e.slug = '这个链接标识已被使用';
    if (!row.starts_at) e.starts_at = '请填写开始时间';
    if (row.ends_at && row.starts_at && row.ends_at < row.starts_at) e.starts_at = '结束时间早于开始时间';
    return e;
  };
  router.get('/admin/events/new', need('events', ({ res, sess }) => html(res, V.eventForm({ sess, kinds: C.EVENT_KINDS }))));
  router.post('/admin/events/new', need('events', ({ res, sess, f, files }) => {
    const row = eventFields(f); const errors = eventErrors(row);
    if (Object.keys(errors).length) return html(res, V.eventForm({ sess, row, kinds: C.EVENT_KINDS, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    const cover = saveCover(files);
    const id = insert('event', { ...row, cover, created_at: now() });
    audit(sess.user.id, 'event.create', String(id));
    redirect(res, '/admin/events?ok=created');
  }, { fileLimit: COVER_MAX + 64 * 1024 }));
  router.get('/admin/events/:id', need('events', ({ res, sess, p, url }) => {
    const row = get('SELECT * FROM event WHERE id = ?', numId(p.id));
    if (!row) throw new HttpError(404, '活动不存在');
    html(res, V.eventForm({ sess, row, kinds: C.EVENT_KINDS, flash: flashOf(url) }));
  }));
  router.post('/admin/events/:id', need('events', ({ res, sess, p, f, files }) => {
    const cur = get('SELECT id, cover FROM event WHERE id = ?', numId(p.id));
    if (!cur) throw new HttpError(404, '活动不存在');
    const row = eventFields(f); const errors = eventErrors(row, cur.id);
    if (Object.keys(errors).length) return html(res, V.eventForm({ sess, row: { ...row, id: cur.id, cover: cur.cover }, kinds: C.EVENT_KINDS, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    const cover = saveCover(files);
    const patch = { ...row, updated_at: now() };
    if (cover) patch.cover = cover; else if (f.remove_cover === '1') patch.cover = null;
    update('event', cur.id, patch);
    audit(sess.user.id, 'event.update', String(cur.id));
    redirect(res, `/admin/events/${cur.id}?ok=saved`);
  }, { fileLimit: COVER_MAX + 64 * 1024 }));
  router.get('/admin/events/:id/regs', need('events', ({ res, sess, p, url }) => {
    const ev = get('SELECT * FROM event WHERE id = ?', numId(p.id));
    if (!ev) throw new HttpError(404, '活动不存在');
    html(res, V.regs({ sess, ev, rows: all('SELECT * FROM event_reg WHERE event_id = ? ORDER BY id DESC', ev.id), flash: flashOf(url) }));
  }));
  router.get('/admin/events/:id/regs.csv', need('events', ({ res, sess, p }) => {
    const ev = get('SELECT * FROM event WHERE id = ?', numId(p.id));
    if (!ev) throw new HttpError(404, '活动不存在');
    audit(sess.user.id, 'event_reg.export', String(ev.id));
    csv(res, `报名名单_${ev.slug}.csv`, ['报名时间', '姓名', '公司', '职务', '手机号', '邮箱', '状态'],
      all('SELECT * FROM event_reg WHERE event_id = ? ORDER BY id', ev.id).map((r) => [r.created_at, r.name, r.company, r.title, r.phone, r.email, V.STATUS.event_reg[r.status]]));
  }));
  router.post('/admin/regs/:id', need('events', ({ res, sess, p, f }) => {
    const r = get('SELECT * FROM event_reg WHERE id = ?', numId(p.id));
    if (!r) throw new HttpError(404, '报名记录不存在');
    if (!V.STATUS.event_reg[f.status]) throw new HttpError(400, '状态不正确');
    run('UPDATE event_reg SET status = ? WHERE id = ?', f.status, r.id);
    audit(sess.user.id, 'event_reg.update', String(r.id));
    redirect(res, `/admin/events/${r.event_id}/regs?ok=saved`);
  }));

  /* 职位与投递 */
  router.get('/admin/jobs', need('jobs', ({ res, sess, url }) => {
    const rows = all("SELECT j.*, (SELECT COUNT(*) FROM job_app a WHERE a.job_id = j.id) AS apps, (SELECT COUNT(*) FROM job_app a WHERE a.job_id = j.id AND a.status = 'new') AS fresh FROM job j ORDER BY j.sort, j.id DESC");
    html(res, V.jobsList({ sess, rows, flash: flashOf(url) }));
  }));
  const jobFields = (f) => ({
    title: clean(f.title, 60), kind: C.CAREERS.kinds.includes(f.kind) ? f.kind : C.CAREERS.kinds[0], city: clean(f.city, 40), team: clean(f.team, 40),
    headcount: intOrNull(f.headcount), sort: intOrNull(f.sort) ?? 100, summary: clean(f.summary, 140), duties: clean(f.duties, 4000),
    requirements: clean(f.requirements, 4000), status: V.STATUS.job[f.status] ? f.status : 'draft',
  });
  const jobErrors = (row) => { const e = {}; if (!row.title) e.title = '请填写职位名称'; if (!row.city) e.city = '请填写城市'; return e; };
  router.get('/admin/jobs/new', need('jobs', ({ res, sess }) => html(res, V.jobForm({ sess, kinds: C.CAREERS.kinds }))));
  router.post('/admin/jobs/new', need('jobs', ({ res, sess, f }) => {
    const row = jobFields(f); const errors = jobErrors(row);
    if (Object.keys(errors).length) return html(res, V.jobForm({ sess, row, kinds: C.CAREERS.kinds, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    const id = insert('job', { ...row, created_at: now() });
    audit(sess.user.id, 'job.create', String(id));
    redirect(res, '/admin/jobs?ok=created');
  }));
  router.get('/admin/jobs/:id', need('jobs', ({ res, sess, p, url }) => {
    const row = get('SELECT * FROM job WHERE id = ?', numId(p.id));
    if (!row) throw new HttpError(404, '职位不存在');
    html(res, V.jobForm({ sess, row, kinds: C.CAREERS.kinds, flash: flashOf(url) }));
  }));
  router.post('/admin/jobs/:id', need('jobs', ({ res, sess, p, f }) => {
    const cur = get('SELECT id FROM job WHERE id = ?', numId(p.id));
    if (!cur) throw new HttpError(404, '职位不存在');
    const row = jobFields(f); const errors = jobErrors(row);
    if (Object.keys(errors).length) return html(res, V.jobForm({ sess, row: { ...row, id: cur.id }, kinds: C.CAREERS.kinds, errors: { ...errors, _form: '请检查标红的项目' } }), 422);
    update('job', cur.id, { ...row, updated_at: now() });
    audit(sess.user.id, 'job.update', String(cur.id));
    redirect(res, `/admin/jobs/${cur.id}?ok=saved`);
  }));
  router.get('/admin/jobs/:id/apps', need('jobs', ({ res, sess, p, url }) => {
    const job = get('SELECT * FROM job WHERE id = ?', numId(p.id));
    if (!job) throw new HttpError(404, '职位不存在');
    html(res, V.apps({ sess, job, rows: all('SELECT * FROM job_app WHERE job_id = ? ORDER BY id DESC', job.id), flash: flashOf(url) }));
  }));
  const appById = (id) => get('SELECT * FROM job_app WHERE id = ?', numId(id));
  router.get('/admin/apps/:id', need('jobs', ({ res, sess, p, url }) => {
    const row = appById(p.id);
    if (!row) throw new HttpError(404, '投递不存在');
    html(res, V.appDetail({ sess, row, job: get('SELECT * FROM job WHERE id = ?', row.job_id), flash: flashOf(url) }));
  }));
  router.post('/admin/apps/:id', need('jobs', ({ res, sess, p, f }) => {
    const row = appById(p.id);
    if (!row) throw new HttpError(404, '投递不存在');
    if (!V.STATUS.job_app[f.status]) throw new HttpError(400, '状态不正确');
    update('job_app', row.id, { status: f.status, note: clean(f.note, 500) });
    audit(sess.user.id, 'job_app.update', String(row.id));
    redirect(res, `/admin/apps/${row.id}?ok=saved`);
  }));
  router.get('/admin/apps/:id/resume', need('jobs', ({ res, sess, p }) => {
    const row = appById(p.id);
    if (!row || !row.resume_file || !/^[\w.-]+$/.test(row.resume_file)) throw new HttpError(404, '简历不存在');
    const file = path.join(UPLOADS, row.resume_file);
    if (!fs.existsSync(file)) throw new HttpError(404, '简历文件不存在');
    audit(sess.user.id, 'job_app.resume', String(row.id));
    const ext = path.extname(row.resume_file).slice(1);
    const type = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.resume_name || row.resume_file)}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  }));

  /* 账号 */
  router.get('/admin/users', need('users', ({ res, sess, url }) => html(res, V.users({ sess, rows: all('SELECT * FROM user ORDER BY id'), flash: flashOf(url) }))));
  router.post('/admin/users', need('users', ({ res, sess, f }) => {
    const account = clean(f.account, 60); const name = clean(f.name, 40); const role = A.ROLES[f.role] ? f.role : null;
    const fail = (m) => html(res, V.users({ sess, rows: all('SELECT * FROM user ORDER BY id'), errors: { _form: m } }), 422);
    if (!/^[A-Za-z0-9._@-]{3,60}$/.test(account)) return fail('账号只能用字母、数字与 . _ @ -，3–60 位');
    if (!name || !role) return fail('请填写姓名并选择角色');
    if (get('SELECT id FROM user WHERE account = ?', account)) return fail('这个账号已存在');
    try { A.checkPasswordStrength(f.password); } catch (e) { return fail(e.message); }
    const id = insert('user', { account, name, role, password_hash: A.hashPassword(f.password), status: 'active', created_at: now() });
    audit(sess.user.id, 'user.create', String(id));
    redirect(res, '/admin/users?ok=created');
  }));
  router.post('/admin/users/:id', need('users', ({ res, sess, p, f }) => {
    const u = get('SELECT * FROM user WHERE id = ?', numId(p.id));
    if (!u) throw new HttpError(404, '账号不存在');
    const role = A.ROLES[f.role] ? f.role : u.role; const status = f.status === 'disabled' ? 'disabled' : 'active';
    if (u.id === sess.user.id && (role !== 'admin' || status !== 'active')) throw new HttpError(400, '不能停用自己或取消自己的管理员角色');
    const patch = { role, status };
    if (f.password) { A.checkPasswordStrength(f.password); patch.password_hash = A.hashPassword(f.password); patch.failed = 0; patch.locked_until = null; }
    update('user', u.id, patch);
    if (status !== 'active' || f.password) run('DELETE FROM session WHERE user_id = ? AND id != ?', u.id, sess.sid);
    audit(sess.user.id, 'user.update', String(u.id));
    redirect(res, '/admin/users?ok=saved');
  }));
  router.get('/admin/password', need(null, ({ res, sess, url }) => html(res, V.password({ sess, flash: flashOf(url) }))));
  router.post('/admin/password', need(null, ({ res, sess, f }) => {
    const u = get('SELECT * FROM user WHERE id = ?', sess.user.id);
    if (!A.verifyPassword(f.old, u.password_hash)) return html(res, V.password({ sess, error: '当前密码不正确' }), 422);
    if (f.new1 !== f.new2) return html(res, V.password({ sess, error: '两次输入的新密码不一致' }), 422);
    try { A.checkPasswordStrength(f.new1); } catch (e) { return html(res, V.password({ sess, error: e.message }), 422); }
    update('user', u.id, { password_hash: A.hashPassword(f.new1) });
    run('DELETE FROM session WHERE user_id = ? AND id != ?', u.id, sess.sid);
    audit(u.id, 'user.password');
    redirect(res, '/admin/password?ok=password');
  }));
}

module.exports = { mount, fromLocal };
