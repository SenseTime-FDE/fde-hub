'use strict';
/**
 * 管理后台页面（服务端渲染，桌面优先）。
 */
const { esc } = require('../http');
const { asset } = require('../assets');
const { ROLES, can } = require('../auth');
const { fmtDate } = require('./pages');

const STATUS = {
  lead: { new: '新线索', contacted: '已联系', qualified: '有效商机', closed: '已关闭' },
  partner_app: { new: '新申请', contacting: '沟通中', signed: '已签约', declined: '暂不合作' },
  event_reg: { new: '已报名', confirmed: '已确认', attended: '已参加', cancelled: '已取消' },
  job_app: { new: '新投递', screening: '筛选中', interview: '面试中', offer: '已发 Offer', rejected: '不合适' },
  event: { draft: '草稿', published: '已发布', archived: '已下线' },
  job: { draft: '草稿', published: '已发布', closed: '已关闭' },
};
const badge = (type, s) => `<span class="badge s-${esc(s)}">${esc(STATUS[type]?.[s] || s)}</span>`;

function shell({ title, sess, active, body, flash }) {
  const u = sess.user;
  const items = [
    ['dash', '/admin', '概览', true],
    ['leads', '/admin/leads', '线索与入群', can(u, 'leads')],
    ['partners', '/admin/partners', '伙伴申请', can(u, 'partners')],
    ['events', '/admin/events', '市场活动', can(u, 'events')],
    ['jobs', '/admin/jobs', '职位与投递', can(u, 'jobs')],
    ['users', '/admin/users', '后台账号', can(u, 'users')],
  ].filter((x) => x[3]);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} · allfde 管理后台</title><link rel="icon" href="/img/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${asset('/css/admin.css')}"></head>
<body class="admin">
<aside class="a-side">
  <a class="a-brand" href="/admin"><img src="/img/sensetime_logo_color.png" alt="商汤科技" width="96" height="27"><span>allfde 管理后台</span></a>
  <nav>${items.map(([k, href, label]) => `<a href="${href}"${k === active ? ' class="on" aria-current="page"' : ''}>${esc(label)}</a>`).join('')}</nav>
  <div class="a-user"><b>${esc(u.name)}</b><span>${esc(ROLES[u.role])} · ${esc(u.account)}</span>
    <a href="/admin/password">修改密码</a>
    <form method="post" action="/admin/logout"><input type="hidden" name="_c" value="${esc(sess.csrf)}"><button type="submit">退出登录</button></form>
    <a href="/" target="_blank" rel="noopener">查看网站</a>
  </div>
</aside>
<main class="a-main">
  ${flash ? `<div class="a-flash" role="status">${esc(flash)}</div>` : ''}
  ${body}
</main>
</body></html>`;
}

function login({ error, account = '' }) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>登录 · allfde 管理后台</title><link rel="icon" href="/img/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${asset('/css/admin.css')}"></head>
<body class="admin-login"><form class="a-login" method="post" action="/admin/login">
<img src="/img/sensetime_logo_color.png" alt="商汤科技" width="130" height="37"><h1>allfde 管理后台</h1>
${error ? `<div class="a-error" role="alert">${esc(error)}</div>` : ''}
<label>账号<input name="account" value="${esc(account)}" autocomplete="username" required maxlength="60"></label>
<label>密码<input name="password" type="password" autocomplete="current-password" required maxlength="200"></label>
<button type="submit">登录</button><p class="a-muted">${esc('商汤科技 · 大模型生态渠道部')}</p></form></body></html>`;
}

const statusFilter = (type, base, cur) => `<nav class="a-filter"><a href="${base}"${!cur ? ' class="on"' : ''}>全部</a>${Object.entries(STATUS[type]).map(([k, v]) => `<a href="${base}?status=${k}"${cur === k ? ' class="on"' : ''}>${esc(v)}</a>`).join('')}</nav>`;
const empty = (cols, text = '暂无数据') => `<tr><td colspan="${cols}" class="a-empty">${esc(text)}</td></tr>`;
const csrfField = (sess) => `<input type="hidden" name="_c" value="${esc(sess.csrf)}">`;
function statusForm(sess, type, action, row) {
  return `<form class="a-inline" method="post" action="${action}">${csrfField(sess)}
  <label>状态<select name="status">${Object.entries(STATUS[type]).map(([k, v]) => `<option value="${k}"${row.status === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
  ${'note' in row ? `<label class="grow">跟进备注<input name="note" value="${esc(row.note || '')}" maxlength="500"></label>` : ''}
  <button type="submit">保存</button></form>`;
}
const dl = (pairs) => `<dl class="a-dl">${pairs.filter(([, v]) => v != null && v !== '').map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

function dashboard({ sess, counts, recent }) {
  const cards = counts.map((c) => `<a class="a-stat" href="${c.href}"><span>${esc(c.label)}</span><b>${c.n}</b><small>待处理 ${c.pending}</small></a>`).join('');
  const body = `<h1>概览</h1><div class="a-stats">${cards}</div>
  <h2>最近提交</h2><table class="a-table"><thead><tr><th>时间</th><th>类型</th><th>提交人</th><th>公司 / 职位</th><th></th></tr></thead><tbody>
  ${recent.length ? recent.map((r) => `<tr><td>${fmtDate(r.created_at)}</td><td>${esc(r.kind)}</td><td>${esc(r.who)}</td><td>${esc(r.what)}</td><td><a href="${r.href}">查看</a></td></tr>`).join('') : empty(5)}
  </tbody></table>`;
  return shell({ title: '概览', sess, active: 'dash', body });
}

const SOURCE = (s) => (s === 'community' ? '技术交流' : '预约演示');
function leads({ sess, rows, status, source = '', flash }) {
  const qs = new URLSearchParams(Object.entries({ status, source }).filter(([, v]) => v)).toString();
  const srcNav = `<nav class="a-filter">${[['', '全部来源'], ['demo', '预约演示'], ['community', '技术交流']].map(([k, v]) => `<a href="/admin/leads${k ? `?source=${k}` : ''}"${source === k ? ' class="on"' : ''}>${esc(v)}</a>`).join('')}</nav>`;
  const body = `<div class="a-head"><h1>线索与入群</h1><a class="a-btn" href="/admin/leads.csv${qs ? `?${qs}` : ''}">导出 CSV</a></div>${srcNav}${statusFilter('lead', `/admin/leads`, status)}
  <table class="a-table"><thead><tr><th>提交时间</th><th>来源</th><th>姓名</th><th>公司</th><th>手机号</th><th>感兴趣</th><th>状态</th><th></th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => `<tr><td>${fmtDate(r.created_at)}</td><td>${SOURCE(r.source)}</td><td>${esc(r.name)}</td><td>${esc(r.company)}</td><td>${esc(r.phone)}</td><td class="clip">${esc(r.interest || '')}</td><td>${badge('lead', r.status)}</td><td><a href="/admin/leads/${r.id}">处理</a></td></tr>`).join('') : empty(8)}
  </tbody></table>`;
  return shell({ title: '预约演示线索', sess, active: 'leads', body, flash });
}
function leadDetail({ sess, row, flash }) {
  const body = `<p><a href="/admin/leads">← 返回线索列表</a></p><h1>${esc(row.name)} · ${esc(row.company)}</h1>
  ${dl([['提交时间', fmtDate(row.created_at)], ['来源', SOURCE(row.source)], ['职务 / 角色', row.title], ['手机号', row.phone], ['邮箱', row.email], ['城市', row.city], ['行业', row.industry], ['感兴趣', row.interest], ['入口参数', row.source && row.source !== 'community' ? row.source : ''], ['留言', row.message]])}
  ${statusForm(sess, 'lead', `/admin/leads/${row.id}`, row)}`;
  return shell({ title: '线索详情', sess, active: 'leads', body, flash });
}

function partners({ sess, rows, status, flash }) {
  const body = `<div class="a-head"><h1>伙伴申请</h1><a class="a-btn" href="/admin/partners.csv${status ? `?status=${status}` : ''}">导出 CSV</a></div>${statusFilter('partner_app', '/admin/partners', status)}
  <table class="a-table"><thead><tr><th>提交时间</th><th>公司</th><th>伙伴身份</th><th>联系人</th><th>手机号</th><th>状态</th><th></th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => `<tr><td>${fmtDate(r.created_at)}</td><td>${esc(r.company)}</td><td>${esc(r.partner_type)}</td><td>${esc(r.contact)}</td><td>${esc(r.phone)}</td><td>${badge('partner_app', r.status)}</td><td><a href="/admin/partners/${r.id}">处理</a></td></tr>`).join('') : empty(7)}
  </tbody></table>`;
  return shell({ title: '伙伴申请', sess, active: 'partners', body, flash });
}
function partnerDetail({ sess, row, flash }) {
  const body = `<p><a href="/admin/partners">← 返回伙伴申请</a></p><h1>${esc(row.company)}</h1>
  ${dl([['提交时间', fmtDate(row.created_at)], ['伙伴身份', row.partner_type], ['手里有什么', row.has_what], ['联系人', row.contact], ['职务', row.title], ['手机号', row.phone], ['邮箱', row.email], ['城市', row.city], ['团队规模', row.team_size], ['深耕行业', row.industries], ['公司与合作设想', row.intro]])}
  ${statusForm(sess, 'partner_app', `/admin/partners/${row.id}`, row)}`;
  return shell({ title: '伙伴申请详情', sess, active: 'partners', body, flash });
}

function eventsList({ sess, rows, flash }) {
  const body = `<div class="a-head"><h1>市场活动</h1><a class="a-btn a-primary" href="/admin/events/new">新建活动</a></div>
  <table class="a-table"><thead><tr><th>开始时间</th><th>活动</th><th>类型</th><th>城市</th><th>报名</th><th>状态</th><th></th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => `<tr><td>${fmtDate(r.starts_at)}</td><td>${esc(r.title)}</td><td>${esc(r.kind)}</td><td>${esc(r.city || '')}</td><td><a href="/admin/events/${r.id}/regs">${r.regs}${r.capacity ? ` / ${r.capacity}` : ''}</a></td><td>${badge('event', r.status)}</td><td><a href="/admin/events/${r.id}">编辑</a>${r.status === 'published' ? ` · <a href="/events/${esc(r.slug)}" target="_blank" rel="noopener">预览</a>` : ''}</td></tr>`).join('') : empty(7, '还没有活动，点右上角「新建活动」')}
  </tbody></table>`;
  return shell({ title: '市场活动', sess, active: 'events', body, flash });
}
const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return '';
  const p = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return p.replace(' ', 'T');
};
function eventForm({ sess, row = {}, kinds, errors = {}, flash }) {
  const f = (k) => esc(row[k] ?? '');
  const err = (k) => (errors[k] ? `<span class="a-err">${esc(errors[k])}</span>` : '');
  const body = `<p><a href="/admin/events">← 返回活动列表</a></p><h1>${row.id ? '编辑活动' : '新建活动'}</h1>
  ${errors._form ? `<div class="a-error">${esc(errors._form)}</div>` : ''}
  <form class="a-form" method="post" action="${row.id ? `/admin/events/${row.id}` : '/admin/events/new'}" enctype="multipart/form-data">${csrfField(sess)}
    <label class="wide">活动名称<input name="title" value="${f('title')}" required maxlength="80">${err('title')}</label>
    <label>链接标识（英文、数字、短横线）<input name="slug" value="${f('slug')}" required maxlength="60" pattern="[a-z0-9-]+">${err('slug')}</label>
    <label>类型<select name="kind">${kinds.map((k) => `<option${row.kind === k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
    <label>开始时间（北京时间）<input type="datetime-local" name="starts_at" value="${toLocal(row.starts_at)}" required>${err('starts_at')}</label>
    <label>结束时间（北京时间）<input type="datetime-local" name="ends_at" value="${toLocal(row.ends_at)}"></label>
    <label>城市<input name="city" value="${f('city')}" maxlength="40" placeholder="线上活动填「线上」"></label>
    <label>地点<input name="venue" value="${f('venue')}" maxlength="120"></label>
    <label>名额上限（空为不限）<input type="number" name="capacity" value="${f('capacity')}" min="0" max="100000"></label>
    <label>开放报名<select name="reg_open"><option value="1"${row.reg_open !== 0 ? ' selected' : ''}>开放</option><option value="0"${row.reg_open === 0 ? ' selected' : ''}>关闭</option></select></label>
    <label class="wide">一句话简介<input name="summary" value="${f('summary')}" maxlength="140"></label>
    <label class="wide">活动详情（空行分段）<textarea name="body" rows="10" maxlength="8000">${f('body')}</textarea></label>
    <div class="wide a-cover">${row.cover ? `<img src="/media/events/${esc(row.cover)}" alt="当前封面" width="240" height="150"><label class="a-check"><input type="checkbox" name="remove_cover" value="1"> 删除当前封面</label>` : '<span class="a-muted">还没有封面</span>'}
      <label>封面图（JPG / PNG / WebP，5 MB 以内，建议 16:10；往期活动显示在「精彩回顾」）<input type="file" name="cover" accept=".jpg,.jpeg,.png,.webp"></label></div>
    <label>状态<select name="status">${Object.entries(STATUS.event).map(([k, v]) => `<option value="${k}"${(row.status || 'draft') === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <div class="wide a-actions"><button type="submit" class="a-primary">保存</button></div>
  </form>`;
  return shell({ title: row.id ? '编辑活动' : '新建活动', sess, active: 'events', body, flash });
}
function regs({ sess, ev, rows, flash }) {
  const body = `<p><a href="/admin/events">← 返回活动列表</a></p><div class="a-head"><h1>报名名单 · ${esc(ev.title)}</h1><a class="a-btn" href="/admin/events/${ev.id}/regs.csv">导出 CSV</a></div>
  <table class="a-table"><thead><tr><th>报名时间</th><th>姓名</th><th>公司</th><th>职务</th><th>手机号</th><th>邮箱</th><th>状态</th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => `<tr><td>${fmtDate(r.created_at)}</td><td>${esc(r.name)}</td><td>${esc(r.company)}</td><td>${esc(r.title || '')}</td><td>${esc(r.phone)}</td><td>${esc(r.email || '')}</td><td>${statusForm(sess, 'event_reg', `/admin/regs/${r.id}`, { id: r.id, status: r.status })}</td></tr>`).join('') : empty(7)}
  </tbody></table>`;
  return shell({ title: '报名名单', sess, active: 'events', body, flash });
}

function jobsList({ sess, rows, flash }) {
  const body = `<div class="a-head"><h1>职位与投递</h1><a class="a-btn a-primary" href="/admin/jobs/new">新建职位</a></div>
  <table class="a-table"><thead><tr><th>排序</th><th>职位</th><th>类型</th><th>城市</th><th>投递</th><th>状态</th><th></th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => `<tr><td>${r.sort}</td><td>${esc(r.title)}</td><td>${esc(r.kind)}</td><td>${esc(r.city)}</td><td><a href="/admin/jobs/${r.id}/apps">${r.apps}${r.fresh ? `（新 ${r.fresh}）` : ''}</a></td><td>${badge('job', r.status)}</td><td><a href="/admin/jobs/${r.id}">编辑</a>${r.status === 'published' ? ` · <a href="/careers/${r.id}" target="_blank" rel="noopener">预览</a>` : ''}</td></tr>`).join('') : empty(7, '还没有职位，点右上角「新建职位」')}
  </tbody></table>`;
  return shell({ title: '职位与投递', sess, active: 'jobs', body, flash });
}
function jobForm({ sess, row = {}, kinds, errors = {}, flash }) {
  const f = (k) => esc(row[k] ?? '');
  const err = (k) => (errors[k] ? `<span class="a-err">${esc(errors[k])}</span>` : '');
  const body = `<p><a href="/admin/jobs">← 返回职位列表</a></p><h1>${row.id ? '编辑职位' : '新建职位'}</h1>
  ${errors._form ? `<div class="a-error">${esc(errors._form)}</div>` : ''}
  <form class="a-form" method="post" action="${row.id ? `/admin/jobs/${row.id}` : '/admin/jobs/new'}">${csrfField(sess)}
    <label class="wide">职位名称<input name="title" value="${f('title')}" required maxlength="60">${err('title')}</label>
    <label>招聘类型<select name="kind">${kinds.map((k) => `<option${row.kind === k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
    <label>城市<input name="city" value="${f('city')}" required maxlength="40">${err('city')}</label>
    <label>所属团队<input name="team" value="${f('team')}" maxlength="40"></label>
    <label>招聘人数<input type="number" name="headcount" value="${f('headcount')}" min="0" max="999"></label>
    <label>排序（小的在前）<input type="number" name="sort" value="${row.sort ?? 100}" min="0" max="9999"></label>
    <label class="wide">一句话介绍<input name="summary" value="${f('summary')}" maxlength="140"></label>
    <label class="wide">岗位职责（一行一条）<textarea name="duties" rows="7" maxlength="4000">${f('duties')}</textarea></label>
    <label class="wide">任职要求（一行一条）<textarea name="requirements" rows="7" maxlength="4000">${f('requirements')}</textarea></label>
    <label>状态<select name="status">${Object.entries(STATUS.job).map(([k, v]) => `<option value="${k}"${(row.status || 'draft') === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <div class="wide a-actions"><button type="submit" class="a-primary">保存</button></div>
  </form>`;
  return shell({ title: row.id ? '编辑职位' : '新建职位', sess, active: 'jobs', body, flash });
}
function apps({ sess, job, rows, flash }) {
  const body = `<p><a href="/admin/jobs">← 返回职位列表</a></p><h1>投递 · ${esc(job.title)}</h1>
  <table class="a-table"><thead><tr><th>投递时间</th><th>姓名</th><th>手机号</th><th>邮箱</th><th>年限</th><th>状态</th><th></th></tr></thead><tbody>
  ${rows.length ? rows.map((r) => `<tr><td>${fmtDate(r.created_at)}</td><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.email)}</td><td>${esc(r.years || '')}</td><td>${badge('job_app', r.status)}</td><td><a href="/admin/apps/${r.id}">处理</a></td></tr>`).join('') : empty(7)}
  </tbody></table>`;
  return shell({ title: '投递列表', sess, active: 'jobs', body, flash });
}
function appDetail({ sess, row, job, flash }) {
  const body = `<p><a href="/admin/jobs/${job.id}/apps">← 返回投递列表</a></p><h1>${esc(row.name)} · ${esc(job.title)}</h1>
  ${dl([['投递时间', fmtDate(row.created_at)], ['手机号', row.phone], ['邮箱', row.email], ['工作年限', row.years], ['期望城市', row.city], ['留言', row.message]])}
  ${row.resume_file ? `<p><a class="a-btn" href="/admin/apps/${row.id}/resume">下载简历：${esc(row.resume_name || row.resume_file)}</a></p>` : ''}
  ${statusForm(sess, 'job_app', `/admin/apps/${row.id}`, row)}`;
  return shell({ title: '投递详情', sess, active: 'jobs', body, flash });
}

function users({ sess, rows, flash, errors = {} }) {
  const body = `<h1>后台账号</h1>
  <table class="a-table"><thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>状态</th><th>最近登录</th><th>调整</th></tr></thead><tbody>
  ${rows.map((r) => `<tr><td>${esc(r.account)}</td><td>${esc(r.name)}</td><td>${esc(ROLES[r.role])}</td><td>${r.status === 'active' ? '启用' : '停用'}</td><td>${r.last_login_at ? fmtDate(r.last_login_at) : '—'}</td><td>
    <form class="a-inline" method="post" action="/admin/users/${r.id}">${csrfField(sess)}
      <select name="role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}"${r.role === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <select name="status"><option value="active"${r.status === 'active' ? ' selected' : ''}>启用</option><option value="disabled"${r.status !== 'active' ? ' selected' : ''}>停用</option></select>
      <input name="password" type="password" placeholder="重置密码（可空）" maxlength="200" autocomplete="new-password">
      <button type="submit">保存</button></form></td></tr>`).join('')}
  </tbody></table>
  <h2>新建账号</h2>${errors._form ? `<div class="a-error">${esc(errors._form)}</div>` : ''}
  <form class="a-form" method="post" action="/admin/users">${csrfField(sess)}
    <label>账号<input name="account" required maxlength="60" pattern="[A-Za-z0-9._@-]+"></label>
    <label>姓名<input name="name" required maxlength="40"></label>
    <label>角色<select name="role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
    <label>初始密码（至少 10 位，含字母与数字）<input name="password" type="password" required maxlength="200" autocomplete="new-password"></label>
    <div class="wide a-actions"><button type="submit" class="a-primary">创建</button></div>
  </form>`;
  return shell({ title: '后台账号', sess, active: 'users', body, flash });
}
function password({ sess, error, flash }) {
  const body = `<h1>修改密码</h1>${error ? `<div class="a-error">${esc(error)}</div>` : ''}
  <form class="a-form narrow" method="post" action="/admin/password">${csrfField(sess)}
    <label class="wide">当前密码<input name="old" type="password" required autocomplete="current-password" maxlength="200"></label>
    <label class="wide">新密码（至少 10 位，含字母与数字）<input name="new1" type="password" required autocomplete="new-password" maxlength="200"></label>
    <label class="wide">再输入一次<input name="new2" type="password" required autocomplete="new-password" maxlength="200"></label>
    <div class="wide a-actions"><button type="submit" class="a-primary">保存</button></div>
  </form>`;
  return shell({ title: '修改密码', sess, active: '', body, flash });
}
function denied(sess) { return shell({ title: '没有权限', sess, active: '', body: '<h1>没有权限</h1><p>当前账号的角色不能访问这个页面。</p>' }); }

module.exports = { STATUS, login, dashboard, leads, leadDetail, partners, partnerDetail, eventsList, eventForm, regs, jobsList, jobForm, apps, appDetail, users, password, denied };
