'use strict';
/**
 * 初始化：建库、创建管理员账号；可选写入示例活动与职位（草稿，不对外显示）。
 *   npm run init                                   交互信息从环境变量读
 *   ALLFDE_ADMIN=admin ALLFDE_ADMIN_PASSWORD=... npm run init
 *   npm run init -- --samples                      另写入示例活动与职位（状态为草稿，后台编辑后再发布）
 * 未提供密码时随机生成一个并只在此处打印一次。
 */
const crypto = require('node:crypto');
const { open, get, insert, now, FILE } = require('../src/db');
const { hashPassword, checkPasswordStrength } = require('../src/auth');

open();
const account = process.env.ALLFDE_ADMIN || 'admin';
let password = process.env.ALLFDE_ADMIN_PASSWORD;
let generated = false;
if (!password) { password = `Allfde${crypto.randomBytes(9).toString('base64url')}9`; generated = true; }
checkPasswordStrength(password);

if (get('SELECT id FROM user WHERE account = ?', account)) {
  console.log(`管理员账号「${account}」已存在，未改动。数据库：${FILE}`);
} else {
  insert('user', { account, name: '管理员', role: 'admin', password_hash: hashPassword(password), status: 'active', created_at: now() });
  console.log(`已创建管理员账号「${account}」。数据库：${FILE}`);
  if (generated) console.log(`初始密码（只显示这一次，请登录后到「修改密码」更换）：${password}`);
}

if (process.argv.includes('--samples')) {
  const day = 24 * 3600 * 1000;
  const at = (n) => { const d = new Date(Date.now() + n * day); d.setUTCHours(6, 0, 0, 0); return d.getTime(); };   // 北京时间 14:00
  const evs = [
    { slug: 'sample-partner-summit', title: '【示例】商汤生态伙伴招商大会', kind: '招商大会', city: '上海', starts_at: new Date(at(30)).toISOString(), summary: '示例活动：请在后台改为真实信息后再发布。', body: '这是一条示例活动，用来演示活动页的版式。\n\n请在后台填写真实的时间、地点与议程，再把状态改为「已发布」。' },
    { slug: 'sample-ai-bootcamp', title: '【示例】企业 AI 启航班', kind: '企业 AI 启航班', city: '线上', starts_at: new Date(at(14)).toISOString(), summary: '示例活动：请在后台改为真实信息后再发布。', body: '这是一条示例活动。' },
  ];
  for (const e of evs) if (!get('SELECT id FROM event WHERE slug = ?', e.slug)) insert('event', { ...e, reg_open: 1, status: 'draft', created_at: now() });
  const jobs = [
    { title: '【示例】AI 落地解决方案工程师', team: '生态渠道部', kind: '社会招聘', city: '北京', summary: '示例职位：请在后台改为真实信息后再发布。', duties: '在客户现场梳理业务场景，配置智能体与知识库\n与伙伴共同交付，沉淀可复用的方案', requirements: '有企业软件或 AI 项目交付经验\n沟通清楚，能独立面对客户' },
    { title: '【示例】生态伙伴经理', team: '生态渠道部', kind: '社会招聘', city: '上海', summary: '示例职位：请在后台改为真实信息后再发布。', duties: '拓展与运营 ISV、服务与渠道伙伴\n推动伙伴方案上架与联合经营', requirements: '有渠道或伙伴管理经验\n熟悉企业服务市场' },
  ];
  for (const j of jobs) if (!get('SELECT id FROM job WHERE title = ?', j.title)) insert('job', { ...j, status: 'draft', sort: 100, created_at: now() });
  console.log('已写入示例活动与职位（草稿，不对外显示）。');
}
