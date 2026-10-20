/* 案例 Demo 专页：读取 js/data.js，完成精选展示、分类和本地搜索。 */
(function () {
  "use strict";

  const source = window.FDE_DATA || { CATEGORIES: [], PROJECTS: [] };
  const projects = Array.isArray(source.PROJECTS) ? source.PROJECTS : [];
  const categories = Array.isArray(source.CATEGORIES) ? source.CATEGORIES : [];
  const state = { category: "all", query: "" };
  const byId = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function tags(project) {
    return (project.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }

  function searchText(project) {
    return [project.title, project.desc, project.badge, ...(project.tags || [])].join(" ").toLowerCase();
  }

  function kind(project) {
    if (project.type === "qr") return { label: "小程序体验", status: "扫码体验", statusClass: "" };
    if (project.access === "login") return { label: project.type === "doc" ? "文档演示" : "内容演示", status: "需登录", statusClass: "" };
    if (project.type === "doc") return { label: "文档演示", status: "打开文档", statusClass: "" };
    if (project.live === false) return { label: "视频演示", status: "打开视频", statusClass: "" };
    return { label: "网页 Demo", status: "公开可访问", statusClass: "is-public" };
  }

  function arrow() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  }

  function featureCard(project) {
    const meta = kind(project);
    const hue = Number.isFinite(Number(project.hue)) ? Number(project.hue) : 8;
    const preview = project.url
      ? `<iframe data-src="${escapeHtml(project.url)}" title="${escapeHtml(project.title)}预览" loading="lazy" sandbox="allow-scripts allow-same-origin" tabindex="-1"></iframe>`
      : "";
    return `<a class="demo-feature-card" style="--demo-hue:${hue}" href="${escapeHtml(project.url || "#")}" target="_blank" rel="noopener" data-feature>
      <div class="demo-feature-preview"><span class="demo-preview-label">${escapeHtml(meta.label)}</span>${preview}</div>
      <div class="demo-feature-copy">
        <p class="demo-eyebrow">${escapeHtml(project.badge)}<span>·</span>场景原型</p>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.desc)}</p>
        <div class="demo-tags">${tags(project)}</div>
        <div class="demo-feature-foot"><span class="demo-status ${meta.statusClass}">${escapeHtml(meta.status)}</span><span>打开 Demo ${arrow()}</span></div>
      </div>
    </a>`;
  }

  function card(project, index) {
    const meta = kind(project);
    const hue = Number.isFinite(Number(project.hue)) ? Number(project.hue) : 8;
    const body = `<div class="demo-card-copy">
      <p class="demo-card-eyebrow">${escapeHtml(project.badge)}<span>·</span>${escapeHtml(meta.label)}</p>
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.desc)}</p>
      <div class="demo-tags">${tags(project)}</div>
      <div class="demo-card-foot"><span class="demo-status ${meta.statusClass}">${escapeHtml(meta.status)}</span>${project.type === "qr" ? "" : `<span>${arrow()}</span>`}</div>
    </div>`;
    const visual = project.type === "qr"
      ? `<div class="demo-card-visual"><img src="/${escapeHtml(project.qr || "")}" alt="${escapeHtml(project.title)}体验二维码" loading="lazy"></div>`
      : `<div class="demo-card-visual"><span class="demo-preview-label">${escapeHtml(meta.label)}</span><span class="demo-card-mark" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span></div>`;
    const attrs = `class="demo-card${project.type === "qr" ? " is-qr" : ""}" style="--demo-hue:${hue}" data-category="${escapeHtml(project.cat)}" data-search="${escapeHtml(searchText(project))}"`;
    return project.type === "qr"
      ? `<article ${attrs}>${visual}${body}</article>`
      : `<a ${attrs} href="${escapeHtml(project.url || "#")}" target="_blank" rel="noopener">${visual}${body}</a>`;
  }

  function fitFeaturePreviews() {
    document.querySelectorAll(".demo-feature-preview").forEach((box) => {
      const frame = box.querySelector("iframe");
      if (!frame) return;
      frame.style.transform = `scale(${box.clientWidth / 1280})`;
    });
  }

  function renderFeatured() {
    const target = byId("demoFeatured");
    if (!target) return;
    const spotlight = projects.filter((project) => project.spotlight).slice(0, 2);
    target.innerHTML = spotlight.map(featureCard).join("");
    fitFeaturePreviews();

    const frames = target.querySelectorAll("iframe[data-src]");
    if (!("IntersectionObserver" in window)) {
      frames.forEach((frame) => { frame.src = frame.dataset.src; });
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const frame = entry.target;
          frame.src = frame.dataset.src;
          observer.unobserve(frame);
        });
      }, { rootMargin: "240px" });
      frames.forEach((frame) => observer.observe(frame));
    }
    frames.forEach((frame) => frame.addEventListener("load", () => frame.classList.add("is-loaded"), { once: true }));
  }

  function renderCategories() {
    const target = byId("demoCategories");
    if (!target) return;
    const present = new Set(projects.map((project) => project.cat));
    const visibleCategories = categories.filter((category) => category.key === "all" || present.has(category.key));
    target.innerHTML = visibleCategories.map((category) => `<button class="demo-category" type="button" data-category="${escapeHtml(category.key)}" aria-pressed="${category.key === "all"}">${escapeHtml(category.label.replace(/\s+[A-Za-z]+$/, ""))}</button>`).join("");
    target.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      target.querySelectorAll("[data-category]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      applyFilters();
    });
  }

  function renderGrid() {
    const target = byId("demoGrid");
    if (!target) return;
    const sorted = projects.map((project, index) => ({ project, index })).sort((a, b) => {
      const aRank = a.project.spotlight ? 2 : a.project.featured ? 1 : 0;
      const bRank = b.project.spotlight ? 2 : b.project.featured ? 1 : 0;
      return bRank - aRank || a.index - b.index;
    });
    target.innerHTML = sorted.map(({ project }, index) => card(project, index)).join("");
  }

  function applyFilters() {
    const query = state.query.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll("#demoGrid .demo-card").forEach((item) => {
      const categoryMatches = state.category === "all" || item.dataset.category === state.category;
      const queryMatches = !query || (item.dataset.search || "").includes(query);
      item.hidden = !(categoryMatches && queryMatches);
      if (!item.hidden) visible += 1;
    });
    const count = byId("demoCount");
    if (count) count.textContent = visible === projects.length ? `共 ${projects.length} 个 Demo 与原型` : `当前 ${visible} / ${projects.length} 个`;
    const empty = byId("demoEmpty");
    if (empty) empty.hidden = visible !== 0;
  }

  const search = byId("demoSearch");
  if (search) search.addEventListener("input", () => {
    state.query = search.value;
    applyFilters();
  });

  renderFeatured();
  renderCategories();
  renderGrid();
  applyFilters();
  window.addEventListener("resize", fitFeaturePreviews, { passive: true });
})();
