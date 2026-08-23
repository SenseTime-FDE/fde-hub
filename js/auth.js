/* ============================================================
   商汤生态渠道官网 — 全站体验身份(演示环境,本地存储,无真实鉴权)
   角色:candidate 候选人 / partner 伙伴 / hr HR 管理员
   API: window.FDE_AUTH = { get, login(presetRole, cb), logout, ROLES }
   登录态变化广播: document 'fde-auth' 事件(detail = session|null)
   ============================================================ */
(function () {
  "use strict";
  const KEY = "fde_session_v1";
  const ROLES = { candidate: "候选人体验", partner: "伙伴体验", hr: "HR 流程体验" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const get = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const broadcast = () => document.dispatchEvent(new CustomEvent("fde-auth", { detail: get() }));
  const setSession = (s) => { localStorage.setItem(KEY, JSON.stringify(s)); renderChip(); broadcast(); };
  const logout = () => { localStorage.removeItem(KEY); renderChip(); broadcast(); };

  /* ---------- 登录弹窗 ---------- */
  let overlay = null, pendingCb = null;
  function buildModal() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-label="切换体验身份">
        <h3>切换体验身份</h3>
        <p class="auth-sub">这不是账号登录。身份和演示数据仅存于本机浏览器，不会进入商汤业务系统。</p>
        <div class="auth-roles">
          <button type="button" data-role="candidate"><b>候选人体验</b><span>模拟投递与进度查看</span></button>
          <button type="button" data-role="partner"><b>伙伴体验</b><span>浏览方案资产与政策</span></button>
          <button type="button" data-role="hr"><b>HR 流程体验</b><span>模拟处理申请与推进流程</span></button>
        </div>
        <input class="auth-name" type="text" placeholder="你的称呼(默认:演示用户)" maxlength="12">
        <div class="auth-actions">
          <button type="button" class="btn btn-red btn-sm" id="authGo" disabled>开始体验</button>
          <button type="button" class="btn btn-ghost btn-sm" id="authCancel">取消</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    let role = null;
    const go = overlay.querySelector("#authGo");
    overlay.querySelectorAll(".auth-roles button").forEach((b) =>
      b.addEventListener("click", () => {
        overlay.querySelectorAll(".auth-roles button").forEach((x) => x.classList.toggle("sel", x === b));
        role = b.dataset.role; go.disabled = false;
      }));
    go.addEventListener("click", () => {
      const name = overlay.querySelector(".auth-name").value.trim() || "演示用户";
      close();
      setSession({ role, name, at: new Date().toLocaleString("zh-CN", { hour12: false }) });
      if (pendingCb) { const cb = pendingCb; pendingCb = null; cb(get()); }
    });
    overlay.querySelector("#authCancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  }
  function close() { if (overlay) overlay.classList.remove("open"); }
  function login(presetRole, cb) {
    buildModal();
    pendingCb = cb || null;
    overlay.querySelectorAll(".auth-roles button").forEach((b) => {
      const sel = b.dataset.role === presetRole;
      b.classList.toggle("sel", sel);
    });
    overlay.querySelector("#authGo").disabled = !presetRole;
    overlay.classList.add("open");
  }

  /* ---------- 导航用户区 ---------- */
  function renderChip() {
    const inner = document.querySelector(".nav-inner");
    if (!inner) return;
    let box = inner.querySelector("#navUser");
    if (!box) {
      box = document.createElement("div");
      box.id = "navUser";
      inner.appendChild(box);
    }
    const s = get();
    if (!s) {
      box.innerHTML = '<button type="button" class="user-login">体验身份</button>';
      box.querySelector(".user-login").addEventListener("click", () => login(null));
    } else {
      box.innerHTML = `<div class="user-chip"><i>${esc(ROLES[s.role] || s.role)}</i><b>${esc(s.name)}</b><button type="button" title="退出体验身份">退出</button></div>`;
      box.querySelector("button").addEventListener("click", logout);
    }
  }

  window.FDE_AUTH = { get, login, logout, ROLES };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderChip);
  else renderChip();
})();
