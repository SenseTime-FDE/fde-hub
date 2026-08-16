/* ============================================================================
 *  声渡 VoxOne · 前端框架(共享外壳 + API 客户端 + 组件)
 *  页面用法:  VX.page("workbench", async (root, ctx) => { root.innerHTML = ... })
 *  ctx = { me, data, ver, scenarios, model, stats, users, gwToken, ... }
 * ========================================================================== */
(function () {
  const TK = "vx_token";
  // 少数浏览器对本地文件(file://)禁用 localStorage —— 退回内存态,本标签页内照常可用
  let memTok = "";
  const token = () => { try { return localStorage.getItem(TK) || memTok; } catch { return memTok; } };
  const setToken = (t) => { memTok = t; try { localStorage.setItem(TK, t); } catch {} };
  const logout = () => { memTok = ""; try { localStorage.removeItem(TK); } catch {} location.href = "login.html"; };

  // ---- 静态模式:没有 Node 服务端时(file:// 直接打开,或纯静态托管),
  //      整套 API 由 assets/local-backend.js 在浏览器内实现,页面行为不变。
  //      file:// 一定走本地;http(s) 先试真实后端,探测到 /api 不可用再切换。
  let LOCAL = window.VXLOCAL && window.VXLOCAL.presumed ? true : null; // null=未知
  const useLocal = () => LOCAL === true && !!window.VXLOCAL;
  const localApi = async (path, method, body) => {
    const r = await window.VXLOCAL.request(path, method, body, token());
    if (r.status === 401 && path !== "/api/login") { logout(); throw new Error("会话过期"); }
    if (r.status >= 400) throw new Error((r.data && r.data.error) || ("HTTP " + r.status));
    return r.data;
  };

  // ---- API ----
  async function api(path, method = "GET", body) {
    if (useLocal()) return localApi(path, method, body);
    let res;
    try {
      res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json", ...(token() ? { Authorization: "Bearer " + token() } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      // 网络层失败:若本地后端可用则永久切换(纯静态托管场景),否则如实抛出
      if (LOCAL === null && window.VXLOCAL) { LOCAL = true; return localApi(path, method, body); }
      throw e;
    }
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    // 静态文件服务器对 /api/* 只会回 404/405 且不是 JSON —— 据此判定「没有后端」
    if (!res.ok && !isJson && LOCAL === null && window.VXLOCAL) { LOCAL = true; return localApi(path, method, body); }
    LOCAL = false;
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401 && path !== "/api/login") { logout(); throw new Error("会话过期"); }
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    return data;
  }
  const change = (kind, payload) => api("/api/change", "POST", { kind, payload });

  // ---- 工具 ----
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtNum = (n) => (n == null ? "—" : Number(n).toLocaleString("en-US"));
  const fmtDur = (s) => { s = Number(s || 0); const m = Math.floor(s / 60), ss = s % 60; return m + "′" + String(ss).padStart(2, "0") + "″"; };
  const fmtTs = (ts) => { try { const d = new Date(ts); return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ts; } };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  const SC = { ecom: "跨境电商 / 零售", app: "出海 App / 游戏", fintech: "金融科技 / 跨境支付", local: "本地生活 / 教育", auto: "汽车 / 保险", "*": "全部场景" };
  const SC_EMOJI = { ecom: "🛒", app: "🎮", fintech: "💳", local: "🏫", auto: "🚗", "*": "🌐" };
  const MODE = { service: "AI 客服", sales: "AI 销售", outbound: "AI 外呼", omni: "全渠道统一" };
  const MODE_BADGE = { service: "ai", sales: "run", outbound: "coral", omni: "coral" };
  const CH = { voice: "电话语音", web: "网页", app: "App", miniapp: "小程序", wechat: "微信", whatsapp: "WhatsApp", line: "LINE", email: "邮件", sms: "短信" };
  const LANG = { zh: "中文", yue: "粤语", en: "English", es: "Español", ar: "العربية", th: "ไทย", vi: "Tiếng Việt", id: "Bahasa", ja: "日本語", pt: "Português" };
  const scLabel = (id) => SC[id] || id;
  const scEmoji = (id) => SC_EMOJI[id] || "🌐";

  const badge = (txt, cls) => `<span class="badge ${cls || "off"}">${esc(txt)}</span>`;
  const modeBadge = (m) => `<span class="badge ${MODE_BADGE[m] || "off"}">${MODE[m] || m}</span>`;
  const statusBadge = (s) => s === "on" || s === "running" ? badge(s === "running" ? "运行中" : "已上线", "on")
    : s === "paused" ? badge("已暂停", "warn") : s === "done" ? badge("已完成", "run") : badge("已下线", "off");

  // ---- toast / modal ----
  function toast(msg, kind) {
    const t = el(`<div class="toast ${kind || ""}">${kind === "err" ? "⚠️" : kind === "ok" ? "✅" : "ℹ️"}<span>${esc(msg)}</span></div>`);
    document.body.appendChild(t); setTimeout(() => { t.style.opacity = "0"; t.style.transition = ".3s"; setTimeout(() => t.remove(), 320); }, 2600);
  }
  function modal({ title, body, footer, onClose, wide }) {
    const mask = el(`<div class="mask"><div class="modal" ${wide ? 'style="width:min(760px,96vw)"' : ""}>
      <div class="mh"><h3>${esc(title || "")}</h3><div style="flex:1"></div><div class="iconbtn xclose">✕</div></div>
      <div class="mb"></div><div class="mf"></div></div></div>`);
    const close = () => { mask.remove(); onClose && onClose(); };
    $(".mb", mask).innerHTML = typeof body === "string" ? body : "";
    if (body instanceof Node) $(".mb", mask).appendChild(body);
    if (footer) $(".mf", mask).appendChild(footer); else $(".mf", mask).remove();
    $(".xclose", mask).onclick = close;
    mask.onclick = (e) => { if (e.target === mask) close(); };
    document.body.appendChild(mask);
    return { mask, close };
  }
  function confirm(msg, onYes, yesLabel) {
    const btnNo = el(`<button class="btn">取消</button>`), btnYes = el(`<button class="btn pri">${esc(yesLabel || "确定")}</button>`);
    const m = modal({ title: "请确认", body: `<div style="font-size:14px;color:var(--ink-1)">${esc(msg)}</div>`, footer: el(`<div style="display:flex;gap:10px"></div>`) });
    m.mask.querySelector(".mf > div").append(btnNo, btnYes);
    btnNo.onclick = m.close; btnYes.onclick = () => { m.close(); onYes(); };
  }

  // ---- 导航 ----
  const NAV = [
    { g: "概览" }, { id: "index", ic: "📊", t: "运营概览" },
    { g: "语音运营" }, { id: "omni", ic: "🌐", t: "全渠道统一坐席" }, { id: "workbench", ic: "🎧", t: "坐席工作台" }, { id: "service", ic: "💬", t: "AI 客服 · Inbound" }, { id: "sales", ic: "📈", t: "AI 销售" }, { id: "outbound", ic: "📞", t: "AI 外呼" },
    { g: "智能资产" }, { id: "agents", ic: "🤖", t: "Agent 编排" }, { id: "knowledge", ic: "📚", t: "知识库 · 话术" }, { id: "voices", ic: "🎙️", t: "音色库" },
    { g: "分析" }, { id: "traces", ic: "🗂️", t: "会话留痕 · 质检" },
    { g: "平台" }, { id: "model", ic: "🧠", t: "SenseAudio 接入" }, { id: "integration", ic: "🔗", t: "统一 Agent 对接" },
    { g: "管理" }, { id: "users", ic: "👥", t: "账号与权限" }, { id: "settings", ic: "⚙️", t: "系统设置" },
  ];
  const PAGE_META = {
    index: { t: "运营概览", sub: "语音原生 AI · 客服 / 销售 / 外呼 一体化" },
    omni: { t: "全渠道统一坐席", sub: "一个 Agent · 语音+文本全双工 · 全渠道统一 · 售前售后一体 · 一套知识库 · SenseAudio V2.0" },
    workbench: { t: "坐席工作台", sub: "语音 + 文本 · 全双工实时对话(SenseAudio Realtime 2.0)" },
    service: { t: "AI 客服 · Inbound", sub: "全渠道自主解决 · 坐席 Copilot · 工单质检" },
    sales: { t: "AI 销售", sub: "对话式销售 · 线索资格审查 · 转化洞察" },
    outbound: { t: "AI 外呼", sub: "主动触达 · 多语言批量并发 · ROI 可量化" },
    agents: { t: "Agent 编排", sub: "绑定 场景 / 模式 / 渠道 / 音色 / 知识库 · 上下架" },
    knowledge: { t: "知识库 · 话术", sub: "RAG 知识 + SOP 话术 · 可推送坐席" },
    voices: { t: "音色库", sub: "零样本克隆 · 品牌音色资产化 · 30 语言 + 粤语" },
    traces: { t: "会话留痕 · 质检", sub: "全量转写留痕 · 质检打分 · 主题洞察" },
    model: { t: "SenseAudio V2.0 接入", sub: "语音大模型矩阵 · 端点健康 · 公开基准" },
    integration: { t: "统一 Agent 管理平台 · 对接", sub: "把 VoxOne 能力接入统一 Agent 平台 · 双向网关" },
    users: { t: "账号与权限", sub: "RBAC · 角色 × 业务场景" },
    settings: { t: "系统设置", sub: "修改密码 · 审计日志 · 数据" },
  };

  function shell(me, pageId) {
    const pages = me.perms.pages || [];
    let nav = "";
    for (const n of NAV) {
      if (n.g) { nav += `<div class="sb-group">${n.g}</div>`; continue; }
      if (!pages.includes(n.id)) continue;
      nav += `<a class="sb-item ${n.id === pageId ? "on" : ""}" href="${n.id}.html"><span class="ic">${n.ic}</span>${n.t}</a>`;
    }
    const meta = PAGE_META[pageId] || { t: "VoxOne", sub: "" };
    const initial = (me.name || me.username || "V").slice(0, 1);
    document.body.innerHTML = `
    <div class="app">
      <aside class="sidebar" id="vxsb">
        <div class="sb-brand">
          <img src="assets/st_logo_white.png" alt="商汤科技 SenseTime"/>
          <div class="prod"><div class="logo-dot">🌊</div><div><b>声渡 VoxOne</b><small>商汤科技 · 语音原生 AI 平台</small></div></div>
        </div>
        <nav class="sb-nav">${nav}</nav>
        <div class="sb-foot">SenseAudio V2.0 · 30 语言 + 粤语<br/>© 商汤科技 · 大模型生态渠道部</div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="iconbtn sidebar-toggle" id="sbtoggle">☰</div>
          <div class="pt">${esc(meta.t)}<small>${esc(meta.sub)}</small></div>
          <div class="sp"></div>
          <div class="env"><span class="dot g"></span> <span id="envmode">内置引擎</span></div>
          <div class="who" id="whobtn">
            <div style="text-align:right"><div class="nm">${esc(me.name || me.username)}</div><div class="rl">${esc(me.roleLabel)}</div></div>
            <div class="av">${esc(initial)}</div>
          </div>
        </header>
        <div class="content" id="vxroot"></div>
      </div>
    </div>`;
    $("#sbtoggle").onclick = () => $("#vxsb").classList.toggle("show");
    $("#whobtn").onclick = () => whoMenu(me);
    return $("#vxroot");
  }

  function whoMenu(me) {
    const scs = (me.scenarios || []).map((s) => scLabel(s)).join("、") || "—";
    const body = `<div class="kv"><span class="k">账号</span><span class="v mono">${esc(me.username)}</span></div>
      <div class="kv"><span class="k">角色</span><span class="v">${esc(me.roleLabel)}</span></div>
      <div class="kv"><span class="k">可见场景</span><span class="v" style="max-width:60%;text-align:right">${esc(scs)}</span></div>
      <div class="kv"><span class="k">权限</span><span class="v">${Object.keys(me.perms).filter((k) => me.perms[k] === true).length} 项</span></div>`;
    const foot = el(`<div style="display:flex;gap:10px"><button class="btn" id="chpw">修改密码</button><button class="btn danger" id="lo">退出登录</button></div>`);
    const m = modal({ title: "当前登录", body, footer: foot });
    $("#lo", foot).onclick = logout;
    $("#chpw", foot).onclick = () => { m.close(); changePw(); };
  }

  function changePw(forced) {
    const body = el(`<div>
      ${forced ? '<div class="notice" style="margin-bottom:14px">🔐 首次登录或密码已被重置,请先修改密码。</div>' : ""}
      <label class="fld"><span class="lb">当前密码</span><input type="password" id="cur" placeholder="初始密码 voxone@2026"/></label>
      <label class="fld"><span class="lb">新密码(至少 6 位)</span><input type="password" id="nw"/></label>
      <label class="fld"><span class="lb">确认新密码</span><input type="password" id="nw2"/></label></div>`);
    const foot = el(`<button class="btn pri">保存</button>`);
    const m = modal({ title: "修改密码", body, footer: foot, onClose: forced ? () => {} : null });
    foot.onclick = async () => {
      const cur = $("#cur", body).value, nw = $("#nw", body).value, nw2 = $("#nw2", body).value;
      if (nw !== nw2) return toast("两次输入不一致", "err");
      try { await api("/api/password", "POST", { current: cur, next: nw }); m.close(); toast("密码已更新", "ok"); }
      catch (e) { toast(e.message, "err"); }
    };
  }

  // ---- 页面入口 ----
  async function page(pageId, render) {
    if (!token()) { location.href = "login.html"; return; }
    let ctx;
    try { ctx = await api("/api/bootstrap"); } catch (e) { return; }
    const me = ctx.me;
    if (!(me.perms.pages || []).includes(pageId)) {
      document.body.innerHTML = `<div class="empty" style="margin-top:20vh"><div class="ic">🔒</div><h3>无权访问该页面</h3><p class="sub">当前角色「${esc(me.roleLabel)}」不包含此页面。</p><a class="btn pri" href="index.html" style="margin-top:12px">返回概览</a></div>`;
      return;
    }
    const root = shell(me, pageId);
    // 先渲染页面,绝不因模型探活而卡住首屏
    try { await render(root, ctx); } catch (e) { root.innerHTML = `<div class="empty"><div class="ic">⚠️</div><h3>页面出错</h3><p class="sub">${esc(e.message)}</p></div>`; console.error(e); }
    if (me.mustChange) setTimeout(() => changePw(true), 300);
    // 环境标识(模型 live/builtin)—— 后台探活,不阻塞渲染(远端端点慢也不拖慢页面)
    api("/api/rt/health").then((h) => {
      const em = $("#envmode");
      if (em) {
        // 静态模式如实标注:数据只在本浏览器 localStorage,不是服务端 SQLite
        em.textContent = (h.mode === "live" ? "实时端点 Live" : "内置引擎") + (useLocal() ? " · 静态模式" : "");
        if (useLocal()) em.title = "当前无 Node 服务端:数据存于本浏览器,换浏览器/换电脑不同步。运行 ./start.sh 可切换为真实后端。";
        const d = $(".env .dot"); if (d) d.className = "dot " + (h.ok ? "g" : "r");
      }
    }).catch(() => {});
  }

  window.VX = {
    api, change, token, setToken, logout, page,
    esc, fmtNum, fmtDur, fmtTs, $, $$, el,
    SC, SC_EMOJI, MODE, CH, LANG, scLabel, scEmoji,
    badge, modeBadge, statusBadge, toast, modal, confirm, changePw,
  };
})();
