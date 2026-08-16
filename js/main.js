/* ============================================================
   商汤生态渠道官网 — 交互脚本(精简版,自 allfde.com 主站同源适配)
   进度条 / 导航 / 滚动渐入 / 方案库渲染与筛选
   ============================================================ */
(function () {
  "use strict";
  const { CATEGORIES, PROJECTS } = window.FDE_DATA || {};
  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const arrow = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  /* ---------- 滚动进度 + 导航底色 ---------- */
  const progress = $("#progress"), nav = $("#nav");
  addEventListener("scroll", () => {
    const h = document.documentElement;
    const max = h.scrollHeight - innerHeight;
    if (progress) progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("solid", scrollY > 8);
  }, { passive: true });

  /* ---------- 滚动渐入 ---------- */
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12 });
  const observeReveals = (root) =>
    (root || document).querySelectorAll(".reveal:not(.in)").forEach((el) => {
      if (el.dataset.d) el.style.setProperty("--d", el.dataset.d);
      io.observe(el);
    });
  observeReveals();

  /* ---------- 能力库(官网首页只展示网页/文档/视频类;小程序类见 demos 页) ---------- */
  const items = (PROJECTS || []).filter((p) => p.type !== "qr");
  const state = { cat: "all", q: "" };
  const capTotal = $("#capTotal");
  if (capTotal) capTotal.textContent = items.length;

  function renderChips() {
    const el = $("#catChips");
    if (!el) return;
    const present = new Set(items.map((p) => p.cat));
    const cats = (CATEGORIES || []).filter((c) => c.key === "all" || present.has(c.key));
    el.innerHTML = cats.map((c, i) =>
      `<button class="chip${i === 0 ? " active" : ""}" type="button" data-cat="${esc(c.key)}">${esc(c.label)}</button>`
    ).join("");
    el.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      state.cat = btn.dataset.cat;
      el.querySelectorAll(".chip").forEach((b) => b.classList.toggle("active", b === btn));
      applyFilter();
    });
  }

  function card(p) {
    const tags = (p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    const isDoc = p.type === "doc";
    const isVideo = !isDoc && p.live === false;
    const typeLabel = isDoc ? "文档演示" : (isVideo ? "视频演示" : "网页 Demo");
    const status = isDoc ? '<span class="demo-status">文档</span>'
      : (isVideo ? '<span class="demo-status">视频</span>' : '<span class="demo-status live"><i></i>Live</span>');
    const preview = (!isDoc && !isVideo && p.url)
      ? `<div class="demo-preview"><div class="demo-preview-fallback">${esc(p.badge)}</div><iframe class="demo-iframe" data-src="${esc(p.url)}" loading="lazy" scrolling="no" sandbox="allow-scripts allow-same-origin" tabindex="-1" title="${esc(p.title)} preview"></iframe></div>`
      : `<div class="demo-preview"><div class="demo-preview-fallback">${typeLabel}</div></div>`;
    const searchText = [p.title, p.desc, p.badge, ...(p.tags || [])].join(" ").toLowerCase();
    return `<a class="demo-card reveal" href="${esc(p.url || "#")}" target="_blank" rel="noopener" data-cat="${esc(p.cat)}" data-text="${esc(searchText)}">
      ${preview}
      <div class="demo-card-top"><span class="demo-type">${typeLabel}</span>${p.featured ? '<span class="demo-featured">重点</span>' : ""}</div>
      <div class="demo-card-body">
        <div><div class="badge">${esc(p.badge)}</div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></div>
        <div class="meta">${tags}</div>
      </div>
      <div class="demo-card-foot">${status}<span class="arrow">${arrow}</span></div>
    </a>`;
  }

  function applyFilter() {
    let count = 0;
    const q = state.q.trim().toLowerCase();
    document.querySelectorAll("#demoGrid .demo-card").forEach((el) => {
      const catOK = state.cat === "all" || el.dataset.cat === state.cat;
      const qOK = !q || (el.dataset.text || "").includes(q);
      const show = catOK && qOK;
      el.hidden = !show;
      if (show) count += 1;
    });
    const rc = $("#resultCount");
    if (rc) rc.textContent = count === items.length ? `共 ${count} 个能力` : `${count} / ${items.length} 个能力`;
    fitPreviews();
  }

  const searchEl = $("#demoSearch");
  if (searchEl) searchEl.addEventListener("input", () => { state.q = searchEl.value; applyFilter(); });

  /* ---------- live 预览:进入视口才加载,按容器宽缩放 ---------- */
  function fitPreviews() {
    document.querySelectorAll(".demo-preview").forEach((box) => {
      const f = box.querySelector(".demo-iframe");
      if (f) f.style.transform = "scale(" + box.clientWidth / 1280 + ")";
    });
  }
  const lazyIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const f = e.target.querySelector(".demo-iframe");
    if (f && !f.src) { f.src = f.dataset.src; f.addEventListener("load", () => f.classList.add("loaded"), { once: true }); }
    lazyIO.unobserve(e.target);
  }), { rootMargin: "300px" });

  function renderGrid() {
    const el = $("#demoGrid");
    if (!el) return;
    const sorted = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    el.innerHTML = sorted.map(card).join("");
    observeReveals(el);
    el.querySelectorAll(".demo-card").forEach((c) => lazyIO.observe(c));
    applyFilter();
  }

  renderChips();
  renderGrid();
  addEventListener("resize", fitPreviews);
})();
