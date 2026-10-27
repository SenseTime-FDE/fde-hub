'use strict';
/**
 * 后台账号、会话、角色权限与 CSRF。
 *   角色：admin 管理员（全部）· marketing 市场（线索、伙伴申请、活动与报名）· hr 招聘（职位与投递）
 *   密码 scrypt；登录连续失败 5 次锁 15 分钟；会话 12 小时，Cookie afs（HttpOnly · SameSite=Lax）。
 *   公开表单用访客 CSRF（Cookie avt 与隐藏字段一致）；后台表单用会话里的 csrf。
 */
const crypto = require('node:crypto');
const { get, run, insert, update, now, audit } = require('./db');
const { token, parseCookies, setCookie, HttpError } = require('./http');

const SESSION_MS = 12 * 3600 * 1000;
const ROLES = { admin: '管理员', marketing: '市场', hr: '招聘' };
const PERMS = {
  leads: ['admin', 'marketing'],
  partners: ['admin', 'marketing'],
  events: ['admin', 'marketing'],
  jobs: ['admin', 'hr'],
  users: ['admin'],
};
const can = (user, perm) => !!user && (PERMS[perm] || []).includes(user.role);

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(String(pw), salt, 32).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [algo, salt, h] = String(stored || '').split('$');
  if (algo !== 'scrypt' || !salt || !h) return false;
  const c = crypto.scryptSync(String(pw), salt, 32);
  const hb = Buffer.from(h, 'hex');
  return hb.length === c.length && crypto.timingSafeEqual(c, hb);
}
function checkPasswordStrength(pw) {
  if (String(pw).length < 10) throw new HttpError(400, '密码至少 10 位');
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) throw new HttpError(400, '密码需同时包含字母与数字');
}

function login(account, password) {
  const user = get('SELECT * FROM user WHERE account = ?', String(account || '').trim());
  const fail = () => { throw new HttpError(401, '账号或密码错误'); };
  if (!user || user.status !== 'active') { verifyPassword(password, 'scrypt$00$00'); fail(); }
  if (user.locked_until && user.locked_until > now()) throw new HttpError(429, '登录失败次数过多，请 15 分钟后再试');
  if (!verifyPassword(password, user.password_hash)) {
    const failed = user.failed + 1;
    update('user', user.id, { failed: failed >= 5 ? 0 : failed, locked_until: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null });
    audit(user.id, 'auth.fail');
    fail();
  }
  update('user', user.id, { failed: 0, locked_until: null, last_login_at: now() });
  const sid = token(32);
  insert('session', { id: sid, user_id: user.id, csrf: token(24), created_at: now(), expires_at: new Date(Date.now() + SESSION_MS).toISOString() });
  audit(user.id, 'auth.login');
  return sid;
}
function logout(req) {
  const sid = parseCookies(req).afs;
  if (sid) run('DELETE FROM session WHERE id = ?', sid);
}
/** 读当前会话：返回 { user, csrf } 或 null */
function current(req) {
  const sid = parseCookies(req).afs;
  if (!sid) return null;
  const s = get('SELECT * FROM session WHERE id = ?', sid);
  if (!s || s.expires_at < now()) { if (s) run('DELETE FROM session WHERE id = ?', sid); return null; }
  const user = get("SELECT id, account, name, role, status FROM user WHERE id = ? AND status = 'active'", s.user_id);
  return user ? { user, csrf: s.csrf, sid } : null;
}
function setSessionCookie(res, sid) { setCookie(res, 'afs', sid, { path: '/', maxAge: SESSION_MS / 1000 }); }
function clearSessionCookie(res) { setCookie(res, 'afs', '', { path: '/', maxAge: 0 }); }

/** 访客 CSRF：没有就发一个；页面把它写进隐藏字段 */
function visitorToken(req, res) {
  let t = parseCookies(req).avt;
  if (!t || !/^[A-Za-z0-9_-]{20,64}$/.test(t)) { t = token(24); setCookie(res, 'avt', t, { maxAge: 7 * 24 * 3600 }); }
  return t;
}
function checkVisitorToken(req, value) {
  const t = parseCookies(req).avt;
  if (!t || !value || t.length !== String(value).length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(String(value)))) {
    throw new HttpError(403, '页面已过期，请刷新后重新提交');
  }
}
function checkSessionCsrf(sess, value) {
  if (!sess || !value || sess.csrf.length !== String(value).length || !crypto.timingSafeEqual(Buffer.from(sess.csrf), Buffer.from(String(value)))) {
    throw new HttpError(403, '页面已过期，请刷新后重新提交');
  }
}

module.exports = { ROLES, PERMS, can, hashPassword, verifyPassword, checkPasswordStrength, login, logout, current, setSessionCookie, clearSessionCookie, visitorToken, checkVisitorToken, checkSessionCsrf };
