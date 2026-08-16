(function () {
  "use strict";

  const app = document.querySelector("#app");
  const PAGE_SIZE = 9;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const richText = (value) => String(value ?? "").split(/(https?:\/\/[^\s，。；、]+)/g).map((part) => {
    if (!/^https?:\/\//.test(part)) return esc(part);
    const safeUrl = esc(part);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
  }).join("");
  const state = { category: "all", query: "", view: "latest", topic: "", visible: PAGE_SIZE };

  function setMeta(selector, attribute, value) {
    const element = document.head.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function setSeo(site, article, topic) {
    const title = article
      ? `${article.title} · OFDE 技术内容中心`
      : topic ? `${topic.title} · OFDE 技术内容中心` : `${site.title} · 商汤生态渠道`;
    const description = article?.summary || topic?.description || site.description;
    const canonical = new URL(location.href);
    canonical.hash = "";
    canonical.search = article
      ? `?id=${encodeURIComponent(article.id)}`
      : topic ? `?topic=${encodeURIComponent(topic.id)}` : "";
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", article ? "article" : "website");
    setMeta('meta[property="og:url"]', "content", canonical.href);
    setMeta('link[rel="canonical"]', "href", canonical.href);
  }

  function setNewsSeo(site, item) {
    const title = `${item.title} · OFDE 资讯解读`;
    const canonical = new URL(location.href);
    canonical.hash = "";
    canonical.search = `?news=${encodeURIComponent(item.id)}`;
    document.title = title;
    setMeta('meta[name="description"]', "content", item.summary);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", item.summary);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[property="og:url"]', "content", canonical.href);
    setMeta('link[rel="canonical"]', "href", canonical.href);
  }

  function isUsableArticle(article) {
    return article && typeof article.id === "string" && typeof article.title === "string"
      && typeof article.summary === "string" && Array.isArray(article.tags)
      && Array.isArray(article.sections) && article.sections.length > 0;
  }

  function articleUrl(id) {
    return `./index.html?id=${encodeURIComponent(id)}`;
  }

  function newsUrl(id) {
    return `./index.html?news=${encodeURIComponent(id)}`;
  }

  function topicUrl(id) {
    return `./index.html?topic=${encodeURIComponent(id)}#topicSelection`;
  }

  function primaryTopic(data, articleId) {
    return data.topics.find((topic) => topic.articles.includes(articleId));
  }

  function normalizeSearch(value) {
    return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
  }

  function articleSearchText(article) {
    const sections = article.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs || []),
      ...(section.list || [])
    ]);
    return normalizeSearch([
      article.title,
      article.summary,
      article.typeLabel,
      article.author,
      ...article.tags,
      ...sections
    ].join(" "));
  }

  function newsSearchText(item) {
    return normalizeSearch([
      item.title,
      item.summary,
      item.editorNote,
      item.source,
      item.category,
      ...(item.tags || []),
      item.lead,
      ...(item.analysis || []).flatMap((section) => [section.heading, ...(section.paragraphs || [])]),
      ...(item.watch || [])
    ].join(" "));
  }

  function formatDate(value) {
    return esc(String(value || "").replaceAll("-", "."));
  }

  function card(article, data, options = {}) {
    const topic = primaryTopic(data, article.id);
    const tags = article.tags.slice(0, options.compact ? 2 : 3);
    return `<a class="tc-card${options.compact ? " tc-card-compact" : ""}" href="${articleUrl(article.id)}" data-article-card>
      <div class="tc-card-meta"><span>${esc(article.typeLabel)}</span><time datetime="${esc(article.date)}">${formatDate(article.date)}</time></div>
      <h3>${esc(article.title)}</h3>
      <p>${esc(article.summary)}</p>
      <div class="tc-card-context">
        ${topic ? `<span class="tc-card-topic">${esc(topic.title)}</span>` : ""}
        <span>${esc(article.readTime)}</span>
      </div>
      <div class="tc-tags">${tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
      <div class="tc-card-foot"><span>${esc(data.site.officialLabel || "官方技术内容")}</span><b>阅读文章 <i aria-hidden="true">↗</i></b></div>
    </a>`;
  }

  function topicCard(topic, index, activeTopicId = "") {
    const active = topic.id === activeTopicId;
    return `<a class="tc-topic-card${active ? " is-active" : ""}" href="${topicUrl(topic.id)}" ${active ? 'aria-current="true"' : ""} data-topic-card="${esc(topic.id)}">
      <span class="tc-topic-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="tc-topic-eyebrow">${esc(topic.eyebrow)}</span>
      <h3>${esc(topic.title)}</h3>
      <p>${esc(topic.description)}</p>
      <b>${active ? "正在浏览" : `${topic.articles.length} 篇文章`} <i aria-hidden="true">${active ? "●" : "→"}</i></b>
    </a>`;
  }

  function topicOverview(data, topic) {
    if (!topic) return "";
    const articles = topic.articles.map((id) => data.articles.find((article) => article.id === id)).filter(Boolean);
    const first = articles[0];
    return `<div class="tc-topic-overview-intro">
      <span>SELECTED PATH</span>
      <h3>${esc(topic.title)}</h3>
      <p>${esc(topic.description)}</p>
      ${first ? `<a href="${articleUrl(first.id)}">从第一篇开始 →</a>` : ""}
    </div>
    <ol class="tc-topic-steps">${articles.map((article, index) => `<li><a href="${articleUrl(article.id)}"><span>${String(index + 1).padStart(2, "0")}</span><div><small>${esc(article.typeLabel)}</small><b>${esc(article.title)}</b></div><em>${esc(article.readTime)}</em></a></li>`).join("")}</ol>`;
  }

  function discussionAction(site) {
    const discussion = site.discussion || {};
    if (discussion.enabled && /^https?:\/\//.test(discussion.url || "")) {
      return `<a href="${esc(discussion.url)}" target="_blank" rel="noopener noreferrer">${esc(discussion.label || "前往 GitHub Discussions")} →</a>`;
    }
    return `<span class="tc-discussion-disabled" aria-disabled="true">${esc(discussion.status || "讨论区待配置")}</span>`;
  }

  function discussionSection(site, detail = false) {
    const discussion = site.discussion || {};
    if (!discussion.enabled && !discussion.showPlaceholder) return "";
    const className = detail ? "tc-discussion" : "tc-community-preview";
    return `<section class="${className}">
      <div><span>COMMUNITY</span><h2>${detail ? "讨论本文" : "在公开社区继续讨论"}</h2><p>${esc(discussion.description || "社区讨论代表参与者观点，不自动构成官方结论。")}</p></div>
      <div class="tc-community-action">${discussionAction(site)}<small>讨论区使用 GitHub Discussions，不在静态官网伪造账号、回复或热度。</small></div>
    </section>`;
  }

  function renderSpotlight(data) {
    const items = data.articles.filter((article) => article.featured)
      .sort((first, second) => second.date.localeCompare(first.date)
        || data.articleOrder.get(first.id) - data.articleOrder.get(second.id))
      .slice(0, 3);
    if (!items.length) return "";
    const [lead, ...secondary] = items;
    return `<section class="tc-spotlight" id="featuredContent" aria-labelledby="featuredTitle">
      <div class="tc-section-head tc-section-head-tight">
        <div><span>EDITOR'S PICK</span><h2 id="featuredTitle">值得先读</h2></div>
        <p>从架构全貌进入，再延伸到运行时和持续学习。</p>
      </div>
      <div class="tc-spotlight-grid">
        <a class="tc-feature-lead" href="${articleUrl(lead.id)}">
          <div><span>${esc(lead.typeLabel)}</span><time datetime="${esc(lead.date)}">${formatDate(lead.date)}</time></div>
          <strong>FEATURED</strong>
          <h3>${esc(lead.title)}</h3>
          <p>${esc(lead.summary)}</p>
          <div class="tc-feature-foot"><span>${esc(lead.readTime)}</span><b>开始阅读 →</b></div>
        </a>
        <div class="tc-spotlight-side">${secondary.map((article) => card(article, data, { compact: true })).join("")}</div>
      </div>
    </section>`;
  }

  function newsCard(item) {
    return `<a class="tc-news-card" href="${newsUrl(item.id)}" data-news-card data-news-search="${esc(newsSearchText(item))}">
      <div class="tc-news-meta"><span>${esc(item.category)}</span><time datetime="${esc(item.date)}">${formatDate(item.date)}</time></div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.summary)}</p>
      <div class="tc-news-note"><b>编辑关注</b><span>${esc(item.editorNote)}</span></div>
      <div class="tc-news-source"><span>${esc(item.source)}</span><b>阅读 OFDE 解读 →</b></div>
    </a>`;
  }

  function renderNews(data) {
    if (!data.news.length) return "";
    return `<section class="tc-trends" id="trendWatch" aria-labelledby="trendWatchTitle">
      <div class="tc-section-head">
        <div><span>TREND WATCH</span><h2 id="trendWatchTitle">近期热门资讯</h2></div>
        <p><span id="trendWatchSummary">更新于 ${formatDate(data.newsUpdatedAt)} · ${data.news.length} 条</span><small>${esc(data.newsNotice)}</small></p>
      </div>
      <div class="tc-news-grid" id="newsGrid">${data.news.map(newsCard).join("")}</div>
    </section>`;
  }

  function renderHome(data) {
    const initialTopic = data.topics.find((topic) => topic.id === state.topic);
    const featuredCount = data.articles.filter((article) => article.featured).length;
    app.innerHTML = `
      <section class="tc-hero">
        <div class="tc-hero-glow" aria-hidden="true"></div>
        <div class="tc-hero-grid-lines" aria-hidden="true"></div>
        <div class="tc-hero-center">
          <span class="tc-hero-eyebrow">TECHNICAL FIELD NOTES · 技术交流</span>
          <h1>面向真实业务的<br><span>技术内容中心</span></h1>
          <p class="tc-hero-lead">${esc(data.site.description)}</p>
          <div class="tc-hero-meta" aria-label="内容统计">
            <span>${data.total} 篇技术内容</span><i aria-hidden="true"></i>
            <span>${data.topics.length} 条专题路径</span><i aria-hidden="true"></i>
            <span>${featuredCount} 篇精选文章</span>
          </div>
          <div class="tc-hero-discovery">
            <label class="tc-hero-search">
              <span aria-hidden="true">⌕</span>
              <input id="contentSearch" type="search" aria-label="搜索全部技术内容" autocomplete="off" placeholder="搜索 MCP、Skill、RAG、Hermes……" value="${esc(state.query)}">
              <button type="button" id="clearSearch" aria-label="清空搜索" ${state.query ? "" : "hidden"}>清除</button>
            </label>
            <div class="tc-hero-topics" aria-label="热门专题">${data.topics.slice(0, 5).map((topic) => `<a href="${topicUrl(topic.id)}">${esc(topic.title)}</a>`).join("")}</div>
          </div>
        </div>
      </section>
      ${renderNews(data)}
      <section class="tc-paths${initialTopic ? " is-topic-mode" : ""}" id="topicSelection" aria-labelledby="topicPathsTitle">
        <div class="tc-section-head">
          <div><span id="topicPathsEyebrow">${initialTopic ? "ACTIVE LEARNING PATH" : "LEARNING PATHS"}</span><h2 id="topicPathsTitle">${initialTopic ? `正在浏览：${esc(initialTopic.title)}` : "选择一条阅读路径"}</h2></div>
          <p id="topicPathsDescription">${initialTopic ? esc(initialTopic.description) : "专题按建议顺序组织文章；进入详情后可继续阅读上一篇或下一篇。"}</p>
        </div>
        <div class="tc-topic-grid">${data.topics.map((topic, index) => topicCard(topic, index, state.topic)).join("")}</div>
        <div class="tc-topic-overview" id="topicOverview" role="status" aria-live="polite" ${initialTopic ? "" : "hidden"}>${topicOverview(data, initialTopic)}</div>
      </section>
      <div id="spotlightRegion" ${initialTopic ? "hidden" : ""}>${renderSpotlight(data)}</div>
      <section class="tc-content" id="browse" aria-labelledby="browseTitle">
        ${data.failures.length ? `<div class="tc-notice" role="status">${data.failures.length} 篇内容暂时加载失败，其余内容仍可正常浏览。</div>` : ""}
        <div class="tc-browse-head">
          <div><span>EXPLORE</span><h2 id="browseTitle">浏览全部内容</h2></div>
          <label class="tc-topic-select"><span>专题</span><select id="topicSelect" aria-label="按专题筛选"><option value="">全部专题</option>${data.topics.map((topic) => `<option value="${esc(topic.id)}" ${topic.id === state.topic ? "selected" : ""}>${esc(topic.title)}</option>`).join("")}</select></label>
        </div>
        <div class="tc-toolbar">
          <div class="tc-tabs" id="categoryTabs" aria-label="内容分类">${data.categories.map((category) => `<button type="button" data-category="${esc(category.id)}" aria-pressed="${category.id === state.category}">${esc(category.label)}</button>`).join("")}</div>
          <div class="tc-view-tabs" id="viewTabs" aria-label="排序和内容范围">
            <button type="button" data-view="latest" aria-pressed="${state.view === "latest"}">最新优先</button>
            <button type="button" data-view="featured" aria-pressed="${state.view === "featured"}">只看精选</button>
            <button type="button" data-view="all" aria-pressed="${state.view === "all"}">默认顺序</button>
          </div>
        </div>
        <div class="tc-active-filter" id="activeFilter" ${initialTopic || state.query || state.category !== "all" || state.view !== "latest" ? "" : "hidden"}>
          <span id="activeFilterText"></span><button type="button" id="resetFilters">重置筛选</button>
        </div>
        <div class="tc-result-meta"><h3 id="resultTitle">最新发布</h3><span id="resultCount"></span></div>
        <div class="tc-grid" id="articleGrid"></div>
        <div class="tc-empty" id="emptyState" hidden><b>没有找到匹配内容</b><p>试试更短的关键词，或重置筛选条件。</p><button type="button" id="emptyReset">查看全部文章</button></div>
        <div class="tc-load-more-wrap" id="loadMoreWrap" hidden><button type="button" id="loadMore">加载更多文章</button></div>
      </section>
      ${discussionSection(data.site)}
      <section class="tc-contribute"><div><span>CONTRIBUTE</span><h2>把你的项目经验写进生态</h2><p>欢迎提交 Skill、场景实践、技术文章与案例复盘。内容保持一文一文件，便于独立评审、更新和迁移。</p></div><a href="mailto:hello@sensetime.com?subject=OFDE%20技术内容投稿">提交选题 →</a></section>`;

    const grid = document.querySelector("#articleGrid");
    const count = document.querySelector("#resultCount");
    const empty = document.querySelector("#emptyState");
    const loadMoreWrap = document.querySelector("#loadMoreWrap");
    const resultTitle = document.querySelector("#resultTitle");
    const searchInput = document.querySelector("#contentSearch");
    const clearSearch = document.querySelector("#clearSearch");
    const topicSelect = document.querySelector("#topicSelect");
    const activeFilter = document.querySelector("#activeFilter");
    const activeFilterText = document.querySelector("#activeFilterText");
    const topicSection = document.querySelector("#topicSelection");
    const topicOverviewElement = document.querySelector("#topicOverview");
    const topicPathsEyebrow = document.querySelector("#topicPathsEyebrow");
    const topicPathsTitle = document.querySelector("#topicPathsTitle");
    const topicPathsDescription = document.querySelector("#topicPathsDescription");
    const spotlightRegion = document.querySelector("#spotlightRegion");
    const newsSection = document.querySelector("#trendWatch");
    const newsSummary = document.querySelector("#trendWatchSummary");
    let lastNewsMatchCount = data.news.length;

    function updateTopicPresentation(focus = false) {
      const activeTopic = data.topics.find((topic) => topic.id === state.topic);
      topicSection.classList.toggle("is-topic-mode", Boolean(activeTopic));
      topicPathsEyebrow.textContent = activeTopic ? "ACTIVE LEARNING PATH" : "LEARNING PATHS";
      topicPathsTitle.textContent = activeTopic ? `正在浏览：${activeTopic.title}` : "选择一条阅读路径";
      topicPathsDescription.textContent = activeTopic ? activeTopic.description : "专题按建议顺序组织文章；进入详情后可继续阅读上一篇或下一篇。";
      document.querySelectorAll("[data-topic-card]").forEach((item) => {
        const active = item.dataset.topicCard === state.topic;
        item.classList.toggle("is-active", active);
        if (active) item.setAttribute("aria-current", "true");
        else item.removeAttribute("aria-current");
        const label = item.querySelector("b");
        const topic = data.topics.find((entry) => entry.id === item.dataset.topicCard);
        if (label && topic) label.innerHTML = active ? '正在浏览 <i aria-hidden="true">●</i>' : `${topic.articles.length} 篇文章 <i aria-hidden="true">→</i>`;
      });
      topicOverviewElement.hidden = !activeTopic;
      topicOverviewElement.innerHTML = topicOverview(data, activeTopic);
      spotlightRegion.hidden = Boolean(activeTopic);
      if (focus && activeTopic) topicSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function syncUrl() {
      const url = new URL(location.href);
      url.search = "";
      if (state.topic) url.searchParams.set("topic", state.topic);
      if (state.category !== "all") url.searchParams.set("category", state.category);
      if (state.query.trim()) url.searchParams.set("q", state.query.trim());
      if (state.view !== "latest") url.searchParams.set("view", state.view);
      url.hash = state.topic ? "topicSelection" : "";
      history.replaceState({}, "", url);
      const activeTopic = data.topics.find((topic) => topic.id === state.topic);
      setSeo(data.site, null, activeTopic);
    }

    function updateControls() {
      document.querySelectorAll("#categoryTabs button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.category === state.category));
      });
      document.querySelectorAll("#viewTabs button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.view === state.view));
      });
      topicSelect.value = state.topic;
      if (searchInput.value !== state.query) searchInput.value = state.query;
      clearSearch.hidden = !state.query;
    }

    function resetFilters() {
      state.category = "all";
      state.query = "";
      state.view = "latest";
      state.topic = "";
      state.visible = PAGE_SIZE;
      updateControls();
      updateTopicPresentation();
      syncUrl();
      apply();
    }

    function apply() {
      const query = normalizeSearch(state.query);
      const terms = query.split(/\s+/).filter(Boolean);
      const matchingNews = data.news.filter((item) => terms.every((term) => newsSearchText(item).includes(term)));
      lastNewsMatchCount = matchingNews.length;
      if (newsSection) {
        newsSection.hidden = Boolean(query) && matchingNews.length === 0;
        document.querySelectorAll("[data-news-card]").forEach((item) => {
          item.hidden = Boolean(query) && !terms.every((term) => item.dataset.newsSearch.includes(term));
        });
        if (newsSummary) newsSummary.textContent = query
          ? `匹配 ${matchingNews.length} 条资讯`
          : `更新于 ${String(data.newsUpdatedAt).replaceAll("-", ".")} · ${data.news.length} 条`;
      }
      const activeTopic = data.topics.find((topic) => topic.id === state.topic);
      const activeCategory = data.categories.find((category) => category.id === state.category);
      let filtered = data.articles.filter((article) => {
        const topicMatch = !activeTopic || activeTopic.articles.includes(article.id);
        const categoryMatch = state.category === "all" || article.category === state.category;
        const text = articleSearchText(article);
        return topicMatch && categoryMatch && terms.every((term) => text.includes(term));
      });
      if (state.view === "featured") filtered = filtered.filter((article) => article.featured);
      if (state.view === "latest") {
        filtered.sort((first, second) => second.date.localeCompare(first.date)
          || data.articleOrder.get(first.id) - data.articleOrder.get(second.id));
      }
      const visible = filtered.slice(0, state.visible);
      grid.innerHTML = visible.map((article) => card(article, data)).join("");
      count.textContent = query
        ? `文章 ${filtered.length} 篇 · 资讯 ${matchingNews.length} 条`
        : filtered.length ? `共 ${filtered.length} 篇 · 已显示 ${visible.length} 篇` : "0 篇";
      empty.hidden = filtered.length !== 0 || matchingNews.length !== 0;
      loadMoreWrap.hidden = visible.length >= filtered.length;
      const filters = [];
      if (state.query.trim()) filters.push(`搜索“${state.query.trim()}”`);
      if (activeTopic) filters.push(`专题：${activeTopic.title}`);
      if (state.category !== "all") filters.push(`分类：${activeCategory?.label || state.category}`);
      if (state.view === "featured") filters.push("只看精选");
      if (state.view === "all") filters.push("默认顺序");
      activeFilter.hidden = filters.length === 0;
      activeFilterText.textContent = filters.join(" · ");
      resultTitle.textContent = query ? "搜索结果" : activeTopic ? activeTopic.title
        : state.category !== "all" ? activeCategory?.label || "分类内容"
          : state.view === "featured" ? "精选文章" : state.view === "all" ? "全部文章" : "最新发布";
      updateControls();
    }

    document.querySelector("#categoryTabs").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      state.visible = PAGE_SIZE;
      syncUrl();
      apply();
    });
    document.querySelector("#viewTabs").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-view]");
      if (!button) return;
      state.view = button.dataset.view;
      state.visible = PAGE_SIZE;
      syncUrl();
      apply();
    });
    topicSelect.addEventListener("change", () => {
      state.topic = topicSelect.value;
      state.visible = PAGE_SIZE;
      syncUrl();
      updateTopicPresentation(Boolean(state.topic));
      apply();
    });
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      state.visible = PAGE_SIZE;
      if (normalizeSearch(state.query)) {
        state.topic = "";
        state.category = "all";
      }
      updateTopicPresentation();
      syncUrl();
      apply();
    });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const target = normalizeSearch(state.query) && lastNewsMatchCount ? newsSection : document.querySelector("#browse");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    clearSearch.addEventListener("click", () => {
      state.query = "";
      state.visible = PAGE_SIZE;
      searchInput.focus();
      syncUrl();
      apply();
    });
    document.querySelector("#resetFilters").addEventListener("click", resetFilters);
    document.querySelector("#emptyReset").addEventListener("click", resetFilters);
    document.querySelector("#loadMore").addEventListener("click", () => {
      state.visible += PAGE_SIZE;
      apply();
    });
    apply();
    if (initialTopic && location.hash === "#topicSelection") {
      requestAnimationFrame(() => topicSection.scrollIntoView({ block: "start" }));
    }
  }

  function renderNewsDetail(data, item) {
    const related = data.news.filter((entry) => entry.id !== item.id).slice(0, 3);
    app.innerHTML = `<article class="tc-article tc-news-article">
      <div class="tc-article-nav">
        <div><a class="tc-back" href="./index.html">← 返回内容中心</a><nav class="tc-breadcrumb" aria-label="面包屑"><a href="./index.html">技术内容中心</a><span>/</span><a href="./index.html#trendWatch">近期热门资讯</a><span>/</span><span>${esc(item.category)}</span></nav></div>
        <button type="button" id="copyNewsLink">复制解读链接</button>
      </div>
      <header>
        <div class="tc-article-kicker"><span class="tc-official">OFDE 资讯解读</span><span>${esc(item.category)}</span><span>基于官方发布</span></div>
        <h1>${esc(item.title)}</h1>
        <p>${esc(item.summary)}</p>
        <div class="tc-article-meta"><time datetime="${esc(item.date)}">资讯日期 ${formatDate(item.date)}</time><span>栏目更新 ${formatDate(data.newsUpdatedAt)}</span><span>来源：${esc(item.source)}</span></div>
        <div class="tc-article-header-tags">${item.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
      </header>
      <div class="tc-news-detail-layout">
        <main class="tc-prose tc-news-prose">
          <div class="tc-news-editorial-lead"><span>编辑导读</span><p>${esc(item.lead)}</p></div>
          ${item.analysis.map((section) => `<section><h2>${esc(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</section>`).join("")}
          <div class="tc-news-watch"><span>接下来，我们会继续关注</span><ul>${item.watch.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ul></div>
        </main>
        <aside class="tc-news-source-panel">
          <span>官方来源</span>
          <h2>${esc(item.source)}</h2>
          <p>这篇解读基于以下官方发布。需要查看完整版本说明时，可以直接打开原文。</p>
          <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">查看官方原文 ↗</a>
          <small>外部页面内容可能继续更新；本页解读更新时间为 ${formatDate(data.newsUpdatedAt)}。</small>
        </aside>
      </div>
    </article>
    <section class="tc-related tc-news-related">
      <div class="tc-section-head"><div><span>MORE SIGNALS</span><h2>继续关注</h2></div><a href="./index.html#trendWatch">返回全部资讯 →</a></div>
      <div class="tc-news-grid">${related.map(newsCard).join("")}</div>
    </section>
    <button class="tc-to-top" id="toTop" type="button" aria-label="返回页面顶部">↑</button>`;

    document.querySelector("#copyNewsLink").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(location.href);
        button.textContent = "链接已复制";
      } catch {
        button.textContent = "请复制地址栏链接";
      }
      setTimeout(() => { button.textContent = "复制解读链接"; }, 1800);
    });
    document.querySelector("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  }

  function renderDetail(data, article) {
    const topic = primaryTopic(data, article.id);
    const topicArticles = topic ? topic.articles.map((id) => data.articles.find((item) => item.id === id)).filter(Boolean) : [];
    const topicIndex = topicArticles.findIndex((item) => item.id === article.id);
    const previous = topicIndex > 0 ? topicArticles[topicIndex - 1] : null;
    const next = topicIndex >= 0 && topicIndex < topicArticles.length - 1 ? topicArticles[topicIndex + 1] : null;
    const related = data.articles.filter((item) => item.id !== article.id
      && (item.category === article.category || item.tags.some((tag) => article.tags.includes(tag)))).slice(0, 3);
    const toc = article.sections.map((section, index) => `<a href="#section-${index + 1}" data-toc="section-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span>${esc(section.heading)}</a>`).join("");
    app.innerHTML = `
      <article class="tc-article">
        <div class="tc-article-nav">
          <div><a class="tc-back" href="./index.html" id="articleBack">← 返回内容中心</a><nav class="tc-breadcrumb" aria-label="面包屑"><a href="./index.html">技术内容中心</a><span>/</span>${topic ? `<a href="${topicUrl(topic.id)}">${esc(topic.title)}</a><span>/</span>` : ""}<span>${esc(article.typeLabel)}</span></nav></div>
          <button type="button" id="copyLink">复制链接</button>
        </div>
        <header>
          <div class="tc-article-kicker"><span class="tc-official">${esc(data.site.officialLabel || "OFDE 官方技术内容")}</span><span>${esc(article.typeLabel)}</span>${topic ? `<span>专题第 ${topicIndex + 1} / ${topicArticles.length} 篇</span>` : ""}</div>
          <h1>${esc(article.title)}</h1>
          <p>${esc(article.summary)}</p>
          <div class="tc-article-meta"><b>${esc(article.author)}</b><time datetime="${esc(article.date)}">发布 ${formatDate(article.date)}</time><time datetime="${esc(article.updatedAt)}">更新 ${formatDate(article.updatedAt)}</time><span>${esc(article.readTime)}</span></div>
          <div class="tc-article-header-tags">${article.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
        </header>
        <details class="tc-mobile-toc"><summary>本文目录 <span>${article.sections.length} 个章节</span></summary><nav>${toc}</nav></details>
        <div class="tc-article-layout">
          <aside><div class="tc-toc-title"><b>本文目录</b><span>${article.sections.length} 节</span></div>${toc}${topic ? `<a class="tc-toc-topic" href="${topicUrl(topic.id)}">查看完整专题 →</a>` : ""}</aside>
          <div class="tc-prose">${article.sections.map((section, index) => `<section id="section-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span><h2>${esc(section.heading)}</h2>${(section.paragraphs || []).map((paragraph) => `<p>${richText(paragraph)}</p>`).join("")}${section.list ? `<ul>${section.list.map((item) => `<li>${richText(item)}</li>`).join("")}</ul>` : ""}</section>`).join("")}</div>
        </div>
      </article>
      ${topic ? `<section class="tc-series-nav">
        <div class="tc-series-head"><div><span>LEARNING PATH · ${topicIndex + 1}/${topicArticles.length}</span><h2>继续“${esc(topic.title)}”</h2><p>${esc(topic.description)}</p></div><a href="${topicUrl(topic.id)}">查看专题全部文章 →</a></div>
        <div class="tc-series-links">
          ${previous ? `<a href="${articleUrl(previous.id)}"><span>上一篇</span><b>${esc(previous.title)}</b></a>` : `<div><span>上一篇</span><b>已是专题第一篇</b></div>`}
          ${next ? `<a href="${articleUrl(next.id)}"><span>下一篇</span><b>${esc(next.title)}</b></a>` : `<div><span>下一篇</span><b>已完成本专题</b></div>`}
        </div>
      </section>` : ""}
      ${discussionSection(data.site, true)}
      ${related.length ? `<section class="tc-related"><div class="tc-section-head tc-section-head-tight"><div><span>READ NEXT</span><h2>相关阅读</h2></div><a href="./index.html">浏览全部内容 →</a></div><div class="tc-grid">${related.map((item) => card(item, data)).join("")}</div></section>` : ""}
      <button type="button" class="tc-to-top" id="toTop" aria-label="返回页面顶部">↑</button>`;

    const copyButton = document.querySelector("#copyLink");
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        copyButton.textContent = "已复制";
      } catch (_error) {
        copyButton.textContent = "请复制地址栏链接";
      }
      setTimeout(() => { copyButton.textContent = "复制文章链接"; }, 1800);
    });
    document.querySelector("#articleBack").addEventListener("click", (event) => {
      const previousUrl = document.referrer ? new URL(document.referrer) : null;
      if (previousUrl?.origin === location.origin && previousUrl.pathname === location.pathname && !previousUrl.searchParams.has("id")) {
        event.preventDefault();
        history.back();
      }
    });
    document.querySelector("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
    const tocLinks = [...document.querySelectorAll("[data-toc]")];
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        tocLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.toc === visible.target.id));
      }, { rootMargin: "-18% 0px -66% 0px", threshold: 0 });
      document.querySelectorAll(".tc-prose section").forEach((section) => observer.observe(section));
    }
  }

  function parseHomeState(data, params) {
    const topic = data.topics.find((item) => item.id === params.get("topic"));
    const category = data.categories.find((item) => item.id === params.get("category"));
    const view = ["latest", "featured", "all"].includes(params.get("view")) ? params.get("view") : "latest";
    state.topic = topic?.id || "";
    state.category = category?.id || "all";
    state.query = params.get("q") || "";
    state.view = view;
    state.visible = PAGE_SIZE;
  }

  async function start() {
    if (location.protocol === "file:") {
      app.setAttribute("aria-busy", "false");
      app.innerHTML = `<section class="tc-error"><h1>请通过本地预览打开</h1><p>浏览器直接打开 HTML 文件时，会阻止页面读取独立文章 JSON 和共享外壳资源。</p><p>请双击模块根目录的“启动技术内容中心预览.command”，或按 QUICK_START.md 中的 HTTP 预览命令启动。</p></section>`;
      return;
    }
    try {
      const [siteResponse, manifestResponse, topicsResponse, newsResponse] = await Promise.all([
        fetch("./data/site.json", { cache: "no-store" }),
        fetch("./data/articles/index.json", { cache: "no-store" }),
        fetch("./data/topics.json", { cache: "no-store" }),
        fetch("./data/news.json", { cache: "no-store" })
      ]);
      if (!siteResponse.ok || !manifestResponse.ok) throw new Error("内容配置加载失败");
      const [siteData, manifest, topicData, newsData] = await Promise.all([
        siteResponse.json(),
        manifestResponse.json(),
        topicsResponse.ok ? topicsResponse.json() : Promise.resolve({ topics: [] }),
        newsResponse.ok ? newsResponse.json() : Promise.resolve({ items: [] })
      ]);
      if (!topicsResponse.ok) console.warn("专题配置加载失败，文章列表仍可正常使用");
      if (!newsResponse.ok) console.warn("资讯配置加载失败，文章列表仍可正常使用");
      const loaded = await Promise.all((manifest.articles || []).map(async (file) => {
        try {
          const response = await fetch(`./data/articles/${encodeURIComponent(file)}`, { cache: "no-store" });
          if (!response.ok) throw new Error(String(response.status));
          const article = await response.json();
          if (!isUsableArticle(article)) throw new Error("文章字段不完整");
          return { article, file };
        } catch (error) {
          console.warn(`文章加载失败：${file}`, error);
          return { article: null, file, error };
        }
      }));
      const data = {
        ...siteData,
        topics: Array.isArray(topicData.topics) ? topicData.topics : [],
        news: Array.isArray(newsData.items) ? [...newsData.items].sort((first, second) => second.date.localeCompare(first.date)) : [],
        newsUpdatedAt: newsData.updatedAt || "",
        newsNotice: newsData.notice || "",
        articles: loaded.map((item) => item.article).filter(Boolean),
        failures: loaded.filter((item) => !item.article),
        total: (manifest.articles || []).length
      };
      data.articleOrder = new Map(data.articles.map((article, index) => [article.id, index]));
      if (!data.articles.length) throw new Error("暂无可用内容");
      const params = new URLSearchParams(location.search);
      const newsId = params.get("news");
      const id = params.get("id");
      app.setAttribute("aria-busy", "false");
      if (newsId) {
        const item = data.news.find((entry) => entry.id === newsId);
        if (!item) {
          app.innerHTML = `<section class="tc-error"><h1>没有找到这条资讯</h1><p>它可能已被更新或移除。</p><a href="./index.html#trendWatch">返回近期热门资讯</a></section>`;
          return;
        }
        setNewsSeo(data.site, item);
        renderNewsDetail(data, item);
        return;
      }
      if (!id) {
        parseHomeState(data, params);
        const topic = data.topics.find((item) => item.id === state.topic);
        setSeo(data.site, null, topic);
        return renderHome(data);
      }
      const article = data.articles.find((item) => item.id === id);
      if (!article) {
        const loadFailed = data.failures.some((item) => item.file === `${id}.json`);
        app.innerHTML = loadFailed
          ? `<section class="tc-error"><h1>这篇内容暂时无法加载</h1><p>其他内容不受影响，可以稍后重试。</p><button type="button" id="retryArticle">重新加载</button><a href="./index.html">返回内容中心</a></section>`
          : `<section class="tc-error"><h1>没有找到这篇内容</h1><p>它可能已被移动或下架。</p><a href="./index.html">返回内容中心</a></section>`;
        document.querySelector("#retryArticle")?.addEventListener("click", () => location.reload());
        return;
      }
      setSeo(data.site, article);
      renderDetail(data, article);
    } catch (error) {
      app.setAttribute("aria-busy", "false");
      app.innerHTML = `<section class="tc-error"><h1>内容暂时无法加载</h1><p>${esc(error.message)}</p><button type="button" onclick="location.reload()">重新加载</button></section>`;
    }
  }

  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = document.querySelector("#progress");
    if (progress) progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
    const toTop = document.querySelector("#toTop");
    if (toTop) toTop.classList.toggle("is-visible", scrollY > 800);
  }, { passive: true });
  start();
})();
