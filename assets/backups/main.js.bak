/* ============================================================
   商汤 FDE · 对外宣传页 — 主逻辑
   读取 data.js 渲染各板块并绑定交互。一般无需修改此文件。
   ============================================================ */
(function () {
  "use strict";

  const { CATEGORIES, ROLES, VALUES, PROJECTS } = window.FDE_DATA;
  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const arrow = "↗";
  const scanIcon =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>';
  const qrMissing = '<div class="qr-missing">二维码待补充<br>放入 images/ 文件夹</div>';

  /* 兜底封面（外站禁止 iframe 内嵌或未加载时显示的暖色块上的极简曲线） */
  function fallbackArt() {
    return '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">' +
      '<g stroke="rgba(255,255,255,.65)" stroke-width="2.5" fill="none" stroke-linecap="round">' +
      '<path d="M28 175 L92 132 L150 150 L212 96 L274 120 L332 70"/></g>' +
      '<g fill="#fff" opacity=".9"><circle cx="92" cy="132" r="4"/><circle cx="212" cy="96" r="4"/><circle cx="332" cy="70" r="4"/></g></svg>';
  }

  /* ---------- 首屏动态徽标：Canvas 流光粒子 ---------- */
  function renderEmblem() {
    const cv = document.getElementById("emblemCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    addEventListener("resize", resize, { passive: true });

    // 预渲染发光精灵（白核 → 透明），用色调叠加上色，性能远好于逐帧渐变
    function sprite(rgb) {
      const s = document.createElement("canvas"), S = 64;
      s.width = s.height = S;
      const g = s.getContext("2d");
      const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      gr.addColorStop(0, "rgba(" + rgb + ",1)");
      gr.addColorStop(0.25, "rgba(" + rgb + ",0.55)");
      gr.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      return s;
    }
    const spGold = sprite("255,196,120"), spRed = sprite("255,82,58"), spWhite = sprite("255,242,228");

    // 无限轨迹（横向 8 字 / 双纽线）参数方程
    function P(t) { return { x: Math.sin(t), y: Math.sin(t) * Math.cos(t) }; }
    // 切向法线（用于让粒子在轨迹两侧散开，形成"光带"宽度）
    function Nrm(t) {
      const dx = Math.cos(t), dy = Math.cos(2 * t), L = Math.hypot(dx, dy) || 1;
      return { x: -dy / L, y: dx / L };
    }

    const cx = () => W / 2, cy = () => H / 2, A = () => Math.min(W, H) * 0.33;

    // 沿轨迹流动的光带粒子
    const flow = [];
    const N = reduce ? 0 : 260;
    for (let i = 0; i < N; i++)
      flow.push({ t: Math.random() * Math.PI * 2, sp: 0.004 + Math.random() * 0.006, off: (Math.random() - 0.5), r: 0.6 + Math.random() * 1.2 });

    // 从两侧注入中心的能量流粒子
    const feed = [];
    const M = reduce ? 0 : 46;
    function spawnFeed(p) {
      const side = Math.random() < 0.5 ? -1 : 1;
      p.side = side; p.u = 0; p.sp = 0.008 + Math.random() * 0.01;
      p.yoff = (Math.random() - 0.5) * 0.5; p.r = 0.6 + Math.random() * 1;
    }
    for (let i = 0; i < M; i++) { const p = {}; spawnFeed(p); p.u = Math.random(); feed.push(p); }

    function blob(sp, x, y, size) {
      ctx.drawImage(sp, x - size / 2, y - size / 2, size, size);
    }

    let raf = 0, running = false;
    function frame() {
      const a = A();
      // 拖尾：每帧叠一层很淡的暗色，旧粒子渐隐成流光尾迹
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(12,8,14,0.20)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // 中心辉光核
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 600);
      blob(spWhite, cx(), cy(), a * 0.9 * pulse);
      blob(spRed, cx(), cy(), a * 1.5 * pulse);

      // 流光粒子沿 ∞ 运动
      for (const p of flow) {
        p.t += p.sp;
        const b = P(p.t), n = Nrm(p.t);
        const w = a * 0.07 * p.off;
        const x = cx() + a * b.x + n.x * w;
        const y = cy() + a * b.y + n.y * w;
        const left = Math.sin(p.t) < 0;          // 左环金、右环红
        const near = 1 - Math.min(1, Math.abs(Math.sin(p.t)) * 1.4); // 越靠中心越白
        const sp = near > 0.55 ? spWhite : (left ? spGold : spRed);
        blob(sp, x, y, (5 + p.r * 6));
        blob(spWhite, x, y, p.r * 2.4);
      }

      // 能量流注入
      for (const p of feed) {
        p.u += p.sp;
        if (p.u >= 1) spawnFeed(p);
        const fx = p.side * (1 - p.u);          // 从边缘 → 中心
        const x = cx() + fx * a * 2.0;
        const y = cy() + p.yoff * a * (1 - p.u) + Math.sin(p.u * 6) * a * 0.04;
        blob(p.side < 0 ? spGold : spRed, x, y, 4 + p.r * 5 * (0.4 + p.u));
        blob(spWhite, x, y, p.r * 1.6);
      }

      raf = requestAnimationFrame(frame);
    }

    function drawStatic() {
      const a = A();
      ctx.fillStyle = "#0c0810"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      blob(spRed, cx(), cy(), a * 1.6);
      for (let t = 0; t < Math.PI * 2; t += 0.04) {
        const b = P(t); const left = Math.sin(t) < 0;
        blob(left ? spGold : spRed, cx() + a * b.x, cy() + a * b.y, 9);
      }
    }

    if (reduce) { drawStatic(); return; }

    // 仅在进入视口时运行，离开/隐藏时暂停，省 CPU
    function start() { if (!running) { running = true; frame(); } }
    function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.05 });
    io.observe(cv);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }

  /* 角色图标（白色线性，叠在暖色块上） */
  const ROLE_ICONS = {
    convert: '<path d="M4 8.5h12"/><path d="M13 5.5l3 3-3 3"/><path d="M20 15.5H8"/><path d="M11 12.5l-3 3 3 3"/>',
    design: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M12 7.6l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/>',
    demo: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M10 8.8l5 3.2-5 3.2z"/>',
    feedback: '<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-8l-4 3v-3a2 2 0 0 1-2-2z"/><path d="M8.5 9.7h7"/><path d="M8.5 12.2h4.5"/>',
    flag: '<path d="M6.5 21V3.5"/><path d="M6.5 4.5h10l-2.3 3.4 2.3 3.4h-10"/>',
    layers: '<path d="M12 3l8.5 4.6L12 12.2 3.5 7.6z"/><path d="M4 12.2l8 4.4 8-4.4"/><path d="M4 16.6l8 4.4 8-4.4"/>',
  };
  function icon(name) {
    const p = ROLE_ICONS[name];
    return p
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
      : "";
  }

  /* ---------- 渲染：六大角色 ---------- */
  function renderRoles() {
    const el = $("#roleGrid");
    if (!el) return;
    el.innerHTML = ROLES.map((r) =>
      `<div class="role-card reveal">
        <div class="role-top">
          ${r.img ? `<img class="role-img" src="${esc(r.img)}" alt="" loading="lazy">` : ""}
          <span class="role-num">${esc(r.num)}</span>
        </div>
        <div class="role-body"><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p></div>
      </div>`
    ).join("");
  }

  /* ---------- 渲染：客户价值 ---------- */
  function renderValues() {
    const el = $("#valueGrid");
    if (!el) return;
    el.innerHTML = VALUES.map((v, i) =>
      `<div class="value-card reveal"><div class="vk">0${i + 1}</div><h3>${esc(v.title)}</h3><p>${esc(v.desc)}</p></div>`
    ).join("");
  }

  /* ---------- 渲染：分类筛选 ---------- */
  function renderFilters() {
    const el = $("#filters");
    if (!el) return;
    el.innerHTML = CATEGORIES.map(
      (c, i) => `<div class="chip${i === 0 ? " active" : ""}" data-f="${esc(c.key)}">${esc(c.label)}</div>`
    ).join("");
  }

  /* ---------- 渲染：作品卡片 ---------- */
  function renderWebCard(p) {
    const tags = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const live = p.live ? '<div class="live"><i></i>Live</div>' : "";
    const hasUrl = p.url && p.url !== "#";
    const preview = hasUrl
      ? `<iframe class="preview" data-src="${esc(p.url)}" loading="lazy" scrolling="no" sandbox="allow-scripts allow-same-origin" tabindex="-1" title="${esc(p.title)} preview"></iframe>`
      : "";
    return `<a class="card reveal" href="${hasUrl ? esc(p.url) : "#"}" data-cat="${esc(p.cat)}" ${hasUrl ? 'target="_blank" rel="noopener"' : ""}>
      <div class="thumb"><div class="fallback">${fallbackArt()}</div>${preview}
        <div class="badge">${esc(p.badge)}</div>${live}<div class="arrow">${arrow}</div></div>
      <div class="body"><h3>${esc(p.title)}</h3><div class="desc">${esc(p.desc)}</div><div class="meta">${tags}</div></div>
    </a>`;
  }

  function renderQrCard(p) {
    const tags = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const qrImg = p.qr ? `<img src="${esc(p.qr)}" alt="${esc(p.title)} 二维码" data-fallback="1">` : qrMissing;
    return `<div class="card reveal is-qr" data-cat="${esc(p.cat)}" data-qr="${esc(p.qr || "")}" data-title="${esc(p.title)}" role="button" tabindex="0" aria-label="${esc(p.title)} 二维码，点击放大">
      <div class="thumb thumb-qr">
        <div class="qr-panel">${qrImg}<div class="qr-hint">${scanIcon}微信扫码体验</div></div>
        <div class="badge">${esc(p.badge)}</div>
        <div class="wechat"><i></i>微信小程序</div>
        <div class="arrow">${scanIcon}</div>
      </div>
      <div class="body"><h3>${esc(p.title)}</h3><div class="desc">${esc(p.desc)}</div><div class="meta">${tags}</div></div>
    </div>`;
  }

  function renderGrid() {
    const g = $("#grid");
    if (!g) return;
    g.innerHTML = PROJECTS.map((p) => (p.type === "qr" ? renderQrCard(p) : renderWebCard(p))).join("");
  }

  /* ---------- 预览自适应缩放 ---------- */
  function fitPreviews() {
    document.querySelectorAll(".thumb").forEach((t) => {
      const f = t.querySelector(".preview");
      if (!f) return;
      f.style.transform = "scale(" + t.clientWidth / 1280 + ")";
    });
  }

  /* ---------- 二维码放大 lightbox ---------- */
  let lb, lbCard;
  function openLB(qr, title) {
    const img = qr
      ? `<img src="${esc(qr)}" alt="${esc(title)} 二维码">`
      : '<div class="lb-missing">二维码待补充<br>请放入 images/ 文件夹</div>';
    lbCard.innerHTML = `${img}<h4>${esc(title)}</h4><p>${scanIcon}微信扫一扫体验</p><button class="lb-close">关闭</button>`;
    lb.classList.add("open");
  }
  function closeLB() { lb.classList.remove("open"); }

  /* ---------- 交互绑定 ---------- */
  function bindInteractions() {
    // 二维码加载失败占位
    document.querySelectorAll(".qr-panel img[data-fallback]").forEach((img) => {
      img.addEventListener("error", () => { img.outerHTML = qrMissing; });
    });

    // lightbox（仅在有 Demo 网格时启用）
    lb = $("#lightbox"); lbCard = $("#lbCard");
    const grid = $("#grid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".card.is-qr");
        if (card) openLB(card.dataset.qr, card.dataset.title);
      });
      grid.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest(".card.is-qr");
        if (!card) return;
        e.preventDefault();
        openLB(card.dataset.qr, card.dataset.title);
      });
    }
    if (lb) {
      lb.addEventListener("click", (e) => {
        if (e.target === lb || e.target.classList.contains("lb-close")) closeLB();
      });
      addEventListener("keydown", (e) => { if (e.key === "Escape") closeLB(); });
    }

    // 预览自适应 + iframe 延迟加载
    fitPreviews();
    addEventListener("resize", fitPreviews, { passive: true });
    const ifObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const f = e.target;
        if (f.dataset.src && !f.src) f.src = f.dataset.src;
        ifObs.unobserve(f);
      });
    }, { rootMargin: "120px" });
    document.querySelectorAll("iframe.preview[data-src]").forEach((f) => {
      f.addEventListener("load", () => { f.classList.add("loaded"); fitPreviews(); });
      ifObs.observe(f);
    });

    // 分类筛选
    const filters = $("#filters");
    if (filters) filters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const f = chip.dataset.f;
      document.querySelectorAll("#grid .card").forEach((card) => {
        card.style.display = f === "all" || card.dataset.cat === f ? "" : "none";
      });
    });

    // 滚动渐入（所有页面）
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // 导航滚动变实底 + 进度条（所有页面）
    const nav = $("#nav"), prog = $("#progress");
    const onScroll = () => {
      if (nav) nav.classList.toggle("solid", scrollY > 8);
      const h = document.documentElement;
      if (prog) prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 启动 ---------- */
  function init() {
    const safe = (fn) => { try { fn(); } catch (e) { console.error("[FDE]", e); } };
    safe(renderRoles);
    safe(renderValues);
    safe(renderFilters);
    safe(renderGrid);
    safe(bindInteractions);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
