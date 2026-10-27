'use strict';
/**
 * 端到端测试：起一个临时库的服务，用 fetch 走真实 HTTP。
 *   页面 · 四类表单（含 CSRF、蜜罐、校验、简历类型）· 后台登录、角色权限、CSRF、活动与职位发布、CSV 导出、简历下载。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'allfde-test-'));
process.env.ALLFDE_DATA = DATA;
const { createServer } = require('../src/server');
const db = require('../src/db');
const { hashPassword } = require('../src/auth');

let base, server;
test.before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const t = db.now();
  db.insert('user', { account: 'admin', name: '管理员', role: 'admin', password_hash: hashPassword('AdminPass123'), status: 'active', created_at: t });
  db.insert('user', { account: 'mkt', name: '市场', role: 'marketing', password_hash: hashPassword('MarketPass123'), status: 'active', created_at: t });
  db.insert('user', { account: 'hr', name: '招聘', role: 'hr', password_hash: hashPassword('HrPassword123'), status: 'active', created_at: t });
});
test.after(() => { server.close(); fs.rmSync(DATA, { recursive: true, force: true }); });

/** 简易 Cookie 罐 */
function agent() {
  const jar = {};
  const cookie = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
  const take = (res) => { for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar[kv.slice(0, i)] = kv.slice(i + 1); } };
  return {
    jar,
    async get(p) { const r = await fetch(base + p, { headers: { cookie: cookie() }, redirect: 'manual' }); take(r); return { status: r.status, text: await r.text(), headers: r.headers }; },
    async post(p, body, extra = {}) {
      const isForm = body instanceof FormData;
      const r = await fetch(base + p, { method: 'POST', redirect: 'manual', headers: { cookie: cookie(), ...(isForm ? {} : { 'content-type': 'application/x-www-form-urlencoded' }), ...extra }, body: isForm ? body : new URLSearchParams(body) });
      take(r); return { status: r.status, text: await r.text(), headers: r.headers };
    },
  };
}
const csrfOf = (html) => /name="_t" value="([^"]+)"/.exec(html)?.[1];
const adminCsrf = (html) => /name="_c" value="([^"]+)"/.exec(html)?.[1];
async function loginAs(account, password) {
  const a = agent();
  const r = await a.post('/admin/login', { account, password });
  assert.equal(r.status, 303);
  return a;
}

test('公开页面都能打开，首页整体介绍生态渠道，口径正确', async () => {
  const a = agent();
  const C = require('../src/content');
  const products = Object.keys(C.PRODUCTS).map((k) => `/solutions/${k}`);
  for (const p of ['/', '/solutions', ...products, '/cloud-maas', '/partners', '/events', '/careers', '/community', '/contact', '/privacy', '/sitemap.xml']) {
    const r = await a.get(p);
    assert.equal(r.status, 200, p);
    if (p !== '/sitemap.xml') { assert.match(r.text, /商汤科技 · 大模型生态渠道部/, p); assert.match(r.text, /沪 ICP 备 19044592 号-3/, p); }
    assert.doesNotMatch(r.text, /建设中|规划中|对客户免费/, p);
  }
  const home = await a.get('/');
  assert.match(home.text, /把 FDE 级的 AI 落地能力/);
  assert.match(home.text, /复制给每一家伙伴/);
  assert.doesNotMatch(home.text, /坚持原创/);
  assert.doesNotMatch(home.text, /hero-canvas|hero\.js|vendor\/three|hero-poster/);   // 三维主视觉已拿掉（2026-10-06）
  assert.doesNotMatch(home.text, /FDE INSIDE/);                                     // v1.2：品牌英文小字去掉 FDE INSIDE
  for (const id of ['about', 'ecosystem', 'solutions', 'cloud', 'partner']) assert.match(home.text, new RegExp(`id="${id}"`), id);
  // 导航：产品与方案下拉 ＝ 方案目录，每项都是一个能打开的产品介绍页；Token Plan 换成云端 MaaS
  assert.match(home.text, /id="menu-solutions"/); assert.match(home.text, /id="menu-cloud"/);
  assert.doesNotMatch(home.text, /href="\/token-plan"/);
  const menu = home.text.slice(home.text.indexOf('id="menu-solutions"'), home.text.indexOf('id="menu-cloud"'));   // 到下一个下拉为止
  const { catalogLeaves } = require('../src/views/layout');
  for (const leaf of C.CATALOG.flatMap(catalogLeaves)) assert.ok(menu.includes(`href="${leaf.href}"`), leaf.href);
  // 下拉里小浣熊企服版分两列：左列 AI 应用主菜单（4+N+X）及其两个一级菜单「商汤小浣熊 · 4」「伙伴 ISV · N＋X」，右列 Raccoon X、MaaS 平台
  const laneHtml = menu.split('class="mega-lane"').slice(1).map((x) => x.split('class="mega-col"')[0]);
  const hrefs = (h) => [...h.matchAll(/href="\/solutions\/([a-z#-]+)"/g)].map((x) => x[1]);
  assert.deepEqual(laneHtml.map(hrefs), [['apps', 'salesbuddy', 'projectbuddy', 'partner-isv', 'partner-isv#industry', 'partner-isv#scenario'], ['raccoon-x', 'maas']]);
  assert.match(laneHtml[0], /商汤小浣熊 · 4/); assert.match(laneHtml[0], /伙伴 ISV · N＋X/); assert.match(laneHtml[0], /分行业与场景/);
  // 先拿掉 HR 小浣熊、客服小浣熊与个人 AI 工具（SoWork、Raccoon Work）（用户 2026-10-06）
  for (const p of ['/', '/solutions', ...products, '/cloud-maas', '/partners', '/contact']) assert.doesNotMatch((await a.get(p)).text, /HR 小浣熊|客服小浣熊|SoWork|Raccoon Work|个人 AI 工具/, p);
  for (const p of ['/solutions/hr', '/solutions/customer-service', '/solutions/ai-tools']) assert.equal((await a.get(p)).status, 404, p);
  // 伙伴 ISV 方案页分行业与场景两个锚点；加入生态页有伙伴 ISV 加入与角色表
  const isvPage = (await a.get('/solutions/partner-isv')).text;
  assert.match(isvPage, /id="industry"/); assert.match(isvPage, /id="scenario"/);
  const partnersPage = (await a.get('/partners')).text;
  assert.match(partnersPage, /id="isv"/); assert.match(partnersPage, /拿 Token，也拿方法/); assert.match(partnersPage, /各方做什么、得到什么/);
  // 万象算力调度平台已拿掉（用户 2026-10-06）
  for (const p of ['/', '/solutions', ...products, '/cloud-maas', '/contact']) assert.doesNotMatch((await a.get(p)).text, /万象|wanxiang/, p);
  assert.equal((await a.get('/solutions/wanxiang')).status, 404);
  const tp = await a.get('/token-plan');
  assert.equal(tp.status, 301); assert.equal(tp.headers.get('location'), '/cloud-maas#token-plan');
  const cloud = await a.get('/cloud-maas');
  for (const id of ['cn', 'os', 'services', 'models', 'token-plan', 'start']) assert.match(cloud.text, new RegExp(`id="${id}"`), id);
  assert.match(cloud.text, /token\.sensetime\.com/); assert.match(cloud.text, /定价、套餐、模型及支付结算各自独立/);
  // 样式与脚本带内容哈希版本号：改了文件地址就变，浏览器不会拿旧样式配新页面
  const css = home.text.match(/href="\/css\/site\.css\?v=([0-9a-f]{10})"/);
  assert.ok(css, 'site.css 带版本号'); assert.match(home.text, /src="\/js\/site\.js\?v=[0-9a-f]{10}"/);
  const crypto = require('node:crypto'); const fs = require('node:fs'); const path = require('node:path');
  assert.equal(css[1], crypto.createHash('sha1').update(fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'site.css'))).digest('hex').slice(0, 10));
  assert.equal((await a.get(`/css/site.css?v=${css[1]}`)).status, 200);
  assert.match((await a.get('/admin/login')).text, /href="\/css\/admin\.css\?v=[0-9a-f]{10}"/);
  const sitemap = await a.get('/sitemap.xml');
  assert.match(sitemap.text, /\/cloud-maas/); assert.doesNotMatch(sitemap.text, /token-plan/);
  assert.match(home.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal((await a.get('/nope')).status, 404);
  assert.equal((await a.get('/solutions/unknown')).status, 404);
});

test('预约演示：CSRF、校验、蜜罐、成功入库', async () => {
  const a = agent();
  const page = await a.get('/contact');
  const t = csrfOf(page.text);
  assert.ok(t);
  assert.equal((await a.post('/contact', { _t: 'bad', name: 'x' })).status, 403);
  const bad = await a.post('/contact', { _t: t, name: '', company: '', phone: 'abc', consent: '1' });
  assert.equal(bad.status, 422);
  assert.match(bad.text, /请填写正确的手机号/);
  const before = db.get('SELECT COUNT(*) n FROM lead').n;
  const bot = await a.post('/contact', { _t: t, name: '机器人', company: '某公司', phone: '13800000000', consent: '1', website: 'http://spam' });
  assert.equal(bot.status, 303);
  assert.equal(db.get('SELECT COUNT(*) n FROM lead').n, before);
  const body = new URLSearchParams({ _t: t, name: '张三', company: '测试科技', phone: '13800000001', email: 'a@b.cn', industry: '金融', consent: '1' });
  body.append('interest', 'SalesBuddy 销售小浣熊'); body.append('interest', '获取产品白皮书'); body.append('interest', '不在列表里');
  const ok = await fetch(base + '/contact', { method: 'POST', redirect: 'manual', headers: { cookie: `avt=${a.jar.avt}`, 'content-type': 'application/x-www-form-urlencoded' }, body });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/thanks/lead');
  const row = db.get('SELECT * FROM lead ORDER BY id DESC LIMIT 1');
  assert.equal(row.name, '张三');
  assert.equal(row.interest, 'SalesBuddy 销售小浣熊、获取产品白皮书');
});

test('加入生态：伙伴身份可多选、至少一种；不在选项里的值丢弃', async () => {
  const a = agent();
  const t = csrfOf((await a.get('/partners')).text);
  const bad = await a.post('/partners', { _t: t, company: '伙伴公司', partner_type: '随便写', contact: '李四', phone: '13900000000', consent: '1' });
  assert.equal(bad.status, 422);
  assert.match(bad.text, /请至少选择一种伙伴身份/);
  const body = new URLSearchParams({ _t: t, company: '伙伴公司', contact: '李四', phone: '13900000000', team_size: '20–99 人', consent: '1' });
  ['FDE 渠道伙伴', 'FDE 服务伙伴', '随便写'].forEach((v) => body.append('partner_type', v));
  ['有客户', '有团队'].forEach((v) => body.append('has_what', v));
  const ok = await fetch(base + '/partners', { method: 'POST', redirect: 'manual', headers: { cookie: `avt=${a.jar.avt}`, 'content-type': 'application/x-www-form-urlencoded' }, body });
  assert.equal(ok.status, 303);
  const row = db.get('SELECT partner_type, has_what FROM partner_app ORDER BY id DESC LIMIT 1');
  assert.equal(row.partner_type, 'FDE 渠道伙伴、FDE 服务伙伴');
  assert.equal(row.has_what, '有客户、有团队');
});

test('技术交流：入群申请进线索表，source = community，后台可按来源筛选', async () => {
  const a = agent();
  const t = csrfOf((await a.get('/community')).text);
  const body = new URLSearchParams({ _t: t, name: '钱七', company: '某团队', title: '开发者 / 工程师', phone: '13500000000', consent: '1' });
  body.append('interest', 'Agent 搭建');
  const r = await fetch(base + '/community', { method: 'POST', redirect: 'manual', headers: { cookie: `avt=${a.jar.avt}`, 'content-type': 'application/x-www-form-urlencoded' }, body });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), '/thanks/community');
  const row = db.get('SELECT * FROM lead ORDER BY id DESC LIMIT 1');
  assert.equal(row.source, 'community');
  assert.equal(row.interest, 'Agent 搭建');
  const mkt = await loginAs('mkt', 'MarketPass123');
  const only = await mkt.get('/admin/leads?source=community');
  assert.match(only.text, /钱七/);
  assert.doesNotMatch(only.text, /张三/);
  assert.match((await mkt.get('/admin/leads?source=demo')).text, /张三/);
});

test('后台：登录、角色权限、会话 CSRF', async () => {
  const anon = agent();
  assert.equal((await anon.get('/admin/leads')).status, 303);
  const wrong = await anon.post('/admin/login', { account: 'admin', password: 'nope' });
  assert.equal(wrong.status, 401);
  const hr = await loginAs('hr', 'HrPassword123');
  assert.equal((await hr.get('/admin/leads')).status, 403);
  assert.equal((await hr.get('/admin/jobs')).status, 200);
  const mkt = await loginAs('mkt', 'MarketPass123');
  assert.equal((await mkt.get('/admin/jobs')).status, 403);
  const list = await mkt.get('/admin/leads');
  assert.equal(list.status, 200);
  assert.match(list.text, /张三/);
  const lead = db.get('SELECT id FROM lead ORDER BY id DESC LIMIT 1');
  assert.equal((await mkt.post(`/admin/leads/${lead.id}`, { _c: 'bad', status: 'contacted' })).status, 403);
  const c = adminCsrf((await mkt.get(`/admin/leads/${lead.id}`)).text);
  const saved = await mkt.post(`/admin/leads/${lead.id}`, { _c: c, status: 'contacted', note: '已电话沟通' });
  assert.equal(saved.status, 303);
  assert.equal(db.get('SELECT status FROM lead WHERE id = ?', lead.id).status, 'contacted');
  const csv = await mkt.get('/admin/leads.csv');
  assert.equal(csv.status, 200);
  assert.ok(csv.text.startsWith('提交时间'));   // fetch 解码时去掉了 BOM，原始字节另查
  const raw = Buffer.from(await (await fetch(base + '/admin/leads.csv', { headers: { cookie: `afs=${mkt.jar.afs}` } })).arrayBuffer());
  assert.deepEqual([...raw.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});

test('活动：后台发布后前台可见，报名入库，名额已满不能报名', async () => {
  const mkt = await loginAs('mkt', 'MarketPass123');
  const c = adminCsrf((await mkt.get('/admin/events/new')).text);
  const r = await mkt.post('/admin/events/new', { _c: c, title: '测试沙龙', slug: 'test-salon', kind: '行业沙龙', starts_at: '2099-01-02T14:00', city: '上海', capacity: '1', reg_open: '1', summary: '一句话', body: '第一段\n\n第二段', status: 'published' });
  assert.equal(r.status, 303);
  const dupe = await mkt.post('/admin/events/new', { _c: c, title: '重复', slug: 'test-salon', kind: '行业沙龙', starts_at: '2099-01-02T14:00', status: 'draft' });
  assert.equal(dupe.status, 422);
  const v = agent();
  assert.match((await v.get('/events')).text, /测试沙龙/);
  const detail = await v.get('/events/test-salon');
  assert.match(detail.text, /2099 年 1 月 2 日 14:00/);
  const t = csrfOf(detail.text);
  assert.equal((await v.post('/events/test-salon', { _t: t, name: '王五', company: '某某', phone: '13700000000', consent: '1' })).status, 303);
  assert.match((await v.get('/events/test-salon')).text, /报名已满/);
  const ev = db.get("SELECT id FROM event WHERE slug = 'test-salon'");
  assert.equal(db.get('SELECT COUNT(*) n FROM event_reg WHERE event_id = ?', ev.id).n, 1);
  assert.equal((await v.get('/events/sample-not-exist')).status, 404);
});

test('招聘：发布职位，投递简历（校验文件类型），后台下载', async () => {
  const hr = await loginAs('hr', 'HrPassword123');
  const c = adminCsrf((await hr.get('/admin/jobs/new')).text);
  assert.equal((await hr.post('/admin/jobs/new', { _c: c, title: '测试工程师', kind: '社会招聘', city: '北京', duties: '写代码\n做测试', requirements: '认真', status: 'published' })).status, 303);
  const job = db.get("SELECT id FROM job WHERE title = '测试工程师'");
  const v = agent();
  assert.match((await v.get('/careers')).text, /测试工程师/);
  assert.match((await v.get('/careers?city=上海')).text, /没有找到符合条件的职位/);
  const page = await v.get(`/careers/${job.id}`);
  const t = csrfOf(page.text);
  const fake = new FormData();
  Object.entries({ _t: t, name: '赵六', phone: '13600000000', email: 'z@l.cn', consent: '1' }).forEach(([k, val]) => fake.append(k, val));
  fake.append('resume', new Blob(['not a pdf']), 'cv.pdf');
  const rejected = await v.post(`/careers/${job.id}`, fake);
  assert.equal(rejected.status, 422);
  assert.match(rejected.text, /只支持 PDF、Word/);
  const good = new FormData();
  Object.entries({ _t: t, name: '赵六', phone: '13600000000', email: 'z@l.cn', years: '3–5 年', consent: '1' }).forEach(([k, val]) => good.append(k, val));
  good.append('resume', new Blob([Buffer.from('%PDF-1.4\n%test\n')], { type: 'application/pdf' }), '赵六简历.pdf');
  assert.equal((await v.post(`/careers/${job.id}`, good)).status, 303);
  const app = db.get('SELECT * FROM job_app ORDER BY id DESC LIMIT 1');
  assert.equal(app.resume_name, '赵六简历.pdf');
  const dl = await hr.get(`/admin/apps/${app.id}/resume`);
  assert.equal(dl.status, 200);
  assert.ok(dl.text.startsWith('%PDF'));
  const mkt = await loginAs('mkt', 'MarketPass123');
  assert.equal((await mkt.get(`/admin/apps/${app.id}/resume`)).status, 403);
});

test('账号：只有管理员能建账号；弱密码被拒；连续失败锁定', async () => {
  const admin = await loginAs('admin', 'AdminPass123');
  const c = adminCsrf((await admin.get('/admin/users')).text);
  assert.equal((await admin.post('/admin/users', { _c: c, account: 'weak', name: '弱', role: 'hr', password: '123' })).status, 422);
  assert.equal((await admin.post('/admin/users', { _c: c, account: 'new.hr', name: '新招聘', role: 'hr', password: 'GoodPass2026' })).status, 303);
  const mkt = await loginAs('mkt', 'MarketPass123');
  assert.equal((await mkt.get('/admin/users')).status, 403);
  const a = agent();
  for (let i = 0; i < 5; i++) await a.post('/admin/login', { account: 'new.hr', password: 'wrong-pass' });
  const locked = await a.post('/admin/login', { account: 'new.hr', password: 'GoodPass2026' });
  assert.equal(locked.status, 429);
});

test('活动封面：后台上传 PNG 后前台可见；非图片被拒', async () => {
  const mkt = await loginAs('mkt', 'MarketPass123');
  const c = adminCsrf((await mkt.get('/admin/events/new')).text);
  const fd = (cover, name, slug) => { const f = new FormData(); Object.entries({ _c: c, title: '封面测试', slug, kind: '行业沙龙', starts_at: '2020-03-04T10:00', status: 'published' }).forEach(([k, v]) => f.append(k, v)); f.append('cover', new Blob([cover]), name); return f; };
  const bad = await mkt.post('/admin/events/new', fd(Buffer.from('not image'), 'x.png', 'cover-bad'));
  assert.equal(bad.status, 400);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  assert.equal((await mkt.post('/admin/events/new', fd(png, 'c.png', 'cover-ok'))).status, 303);
  const ev = db.get("SELECT cover FROM event WHERE slug = 'cover-ok'");
  assert.match(ev.cover, /^\d+_[\w-]+\.png$/);
  const v = agent();
  const list = await v.get('/events');
  assert.match(list.text, /市场活动集锦/);   // 往期活动出现在精彩回顾
  assert.match(list.text, new RegExp(`/media/events/${ev.cover}`));
  const img = await fetch(`${base}/media/events/${ev.cover}`);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
  assert.equal((await fetch(`${base}/media/events/..%2Fsite.db`)).status, 404);
});
