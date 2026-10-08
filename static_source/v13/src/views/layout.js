'use strict';
/**
 * 页面外壳：<head>、页眉导航、页脚。v1.2：商汤 ｜ 生态渠道 AI ECOSYSTEM PARTNERSHIPS；
 * 导航 产品与方案（下拉：商汤 AI 全栈方案目录，每项跳转产品介绍页）· 云端 MaaS（下拉：国内 · 海外 · 模型 · 服务）
 * · 市场活动 · 人才招聘 · 技术交流 · 加入生态；右侧「申请加入」「体验身份」；页脚备案信息。
 */
const { esc } = require('../http');
const { SITE, CATALOG, PRODUCTS } = require('../content');
const { asset } = require('../assets');

const ICON_MENU = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_OUT = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const ICON_DOWN = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** 目录分列：组内条目带 lane 时按 lane 分成几列（小浣熊企服版：应用一列，平台与工具一列），否则返回 null */
function lanesOf(g) {
  if (!g.items.some((i) => i.lane)) return null;
  const out = [];
  for (const i of g.items) { const k = (i.lane || 1) - 1; (out[k] = out[k] || []).push(i); }
  return out.filter(Boolean);
}

/** 目录条目的地址（带锚点的条目跳到产品页的对应分节） */
const hrefOf = (i) => `/solutions/${i.slug}${i.anchor ? `#${i.anchor}` : ''}`;

/** 目录里所有可跳转的条目：含 AI 应用主菜单下两个一级菜单里的条目 */
function catalogLeaves(g) {
  const out = [];
  for (const i of g.items) {
    if (i.slug) out.push({ ...i, href: hrefOf(i) });
    for (const sub of i.subs || []) for (const x of sub.items) out.push({ ...x, href: hrefOf(x) });
  }
  return out;
}

/** 产品与方案下拉：总览 ＋ 三组目录（与总览页同一份 CATALOG）；
 *  小浣熊企服版分两列：AI 应用主菜单（4+N+X，当前只列有完整公开页面的商汤小浣熊）一列，Raccoon X、MaaS 平台一列 */
function menuSolutions() {
  const item = (i, cls = '') => `<a class="menu-item${cls}" href="${hrefOf(i)}"><b>${esc(i.name)}</b><span>${esc(i.text)}</span></a>`;
  const sub = (x) => `<div class="menu-sub"><p class="menu-sub-label">${x.slug ? `<a href="/solutions/${x.slug}">${esc(x.label)}</a>` : esc(x.label)}${x.note ? `<small>${esc(x.note)}</small>` : ''}</p>${x.items.map((i) => item(i)).join('')}</div>`;
  const lane = (l) => `<div class="mega-lane">${l.map((i) => item(i, ' menu-main') + (i.subs || []).map(sub).join('')).join('')}</div>`;
  const cols = CATALOG.map((g) => `<div class="mega-col">
      ${g.href ? `<a class="mega-head" href="${g.href}"><b>${esc(g.title)}</b><small>${esc(g.en)}</small>${ICON_ARROW}</a>` : `<p class="mega-head"><b>${esc(g.title)}</b><small>${esc(g.en)}</small></p>`}
      <p class="mega-note">${esc(g.note)}</p>
      ${lanesOf(g) ? `<div class="mega-lanes">${lanesOf(g).map(lane).join('')}</div>` : g.items.map((i) => item(i)).join('')}
    </div>`).join('');
  return `<div class="nav-menu mega" id="menu-solutions">
    <div class="mega-in">
      <a class="mega-overview" href="/solutions"><span class="mega-kicker">SOLUTIONS · 总览</span><b>商汤 AI 全栈方案</b><span>方案目录 · 整体架构 · 业务逻辑 · 部署形态</span>${ICON_ARROW}</a>
      <div class="mega-cols">${cols}</div>
    </div>
  </div>`;
}

/** 云端 MaaS 下拉：国内、海外两个平台，模型与服务 */
function menuCloud() {
  const items = [
    ['/cloud-maas#cn', '国内平台', 'token.sensetime.com · 开通即用'],
    ['/cloud-maas#os', '海外平台', '整合 Raccoon X · 面向海外企业'],
    ['/cloud-maas#services', '服务', '智能体 · Token Plan · 模型 API'],
    ['/cloud-maas#models', '模型', '商汤自研和开源大模型 ＋ 第三方聚合'],
    ['/cloud-maas#start', '开通与支付', '五步开通 · 线上支付与线下合同'],
  ];
  return `<div class="nav-menu" id="menu-cloud">
    ${items.map(([h, b, t]) => `<a class="menu-item" href="${h}"><b>${esc(b)}</b><span>${esc(t)}</span></a>`).join('')}
    <a class="menu-item menu-out" href="https://token.sensetime.com" target="_blank" rel="noopener"><b>前往国内平台 ${ICON_OUT}</b><span>token.sensetime.com</span></a>
  </div>`;
}

function header(active, overlay) {
  const menus = { solutions: menuSolutions, cloud: menuCloud };
  const links = SITE.nav.map((n) => {
    const on = n.key === active ? ' aria-current="page"' : '';
    const link = `<a class="nav-link${n.key === active ? ' on' : ''}" href="${n.href}"${on}>${esc(n.label)}</a>`;
    if (!n.menu) return `<div class="nav-item">${link}</div>`;
    return `<div class="nav-item has-menu" data-menu>${link}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-${n.menu}" aria-label="展开${esc(n.label)}菜单">${ICON_DOWN}</button>${menus[n.menu]()}</div>`;
  }).join('');
  return `<header class="site-header${overlay ? ' overlay' : ''}" data-header>
  <div class="header-in">
    <a class="brand" href="/" aria-label="${esc(SITE.name)} · 首页">
      <img class="brand-logo" src="/img/sensetime_logo_color.png" alt="商汤科技 SenseTime" width="112" height="32">
      <span class="brand-div" aria-hidden="true"></span>
      <span class="brand-text"><b>生态渠道</b><small>${esc(SITE.brandEn)}</small></span>
    </a>
    <nav class="main-nav" id="main-nav" aria-label="主导航">${links}
      <span class="nav-mobile-ctas"><a class="btn btn-red btn-sm" href="/partners#apply">申请加入</a><a class="btn btn-ghost btn-sm" href="/partners#identity">体验身份</a></span>
    </nav>
    <div class="header-ctas"><a class="btn btn-red btn-sm" href="/partners#apply">申请加入</a><a class="btn btn-ghost btn-sm" href="/partners#identity">体验身份</a></div>
    <button class="nav-toggle" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="打开菜单" data-nav-toggle>${ICON_MENU}</button>
  </div>
</header>`;
}

function footer() {
  const F = SITE.footer;
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <img src="/img/sensetime_logo_color.png" alt="商汤科技 SenseTime" width="132" height="37">
      <p class="footer-slogan">把 FDE 级的 AI 落地能力，复制给每一家伙伴</p>
      <p class="footer-sign">${esc(SITE.sign)}<br><span>${esc(SITE.signEn)}</span></p>
    </div>
    <div class="footer-col">
      <h3>产品与方案</h3>
      <a href="/solutions">商汤 AI 全栈方案</a>${['raccoonbuddy', 'salesbuddy', 'projectbuddy', 'raccoon-x', 'maas', 'model-api', 'services'].map((k) => `<a href="/solutions/${k}">${esc(PRODUCTS[k].name)}${/[A-Za-z]$/.test(PRODUCTS[k].name) && !/^[A-Z][a-z]/.test(PRODUCTS[k].cn) ? ` ${esc(PRODUCTS[k].cn)}` : ''}</a>`).join('')}
    </div>
    <div class="footer-col">
      <h3>云端 MaaS</h3>
      <a href="/cloud-maas#cn">国内平台</a><a href="/cloud-maas#os">海外平台</a><a href="/cloud-maas#services">智能体 · Token Plan · 模型 API</a><a href="/cloud-maas#models">模型</a><a href="https://token.sensetime.com" target="_blank" rel="noopener">token.sensetime.com ${ICON_OUT}</a>
    </div>
    <div class="footer-col">
      <h3>生态与合作</h3>
      <a href="/partners">加入生态</a><a href="/partners#identity">体验身份</a><a href="/events">市场活动</a><a href="/community">技术交流</a><a href="/careers">人才招聘</a><a href="/contact">预约演示</a><a href="https://www.sensetime.com" target="_blank" rel="noopener">商汤官网 ${ICON_OUT}</a><a href="/privacy">隐私说明</a>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p><a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">${esc(F.icp)}</a><span class="sep">｜</span>${esc(F.police)}<span class="sep">｜</span>${esc(F.copyright)} ${esc(F.company)}</p>
    <p>${esc(SITE.sign)}<span class="sep">｜</span>${esc(F.note)}</p>
  </div>
</footer>`;
}

/**
 * page({ title, description, active, overlay, body, head, scripts })
 */
function page({ title, description, active, overlay = false, body, head = '', scripts = '' }) {
  const t = title ? `${title} · ${SITE.name}` : `${SITE.name} · 把 FDE 级的 AI 落地能力复制给每一家伙伴`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(description || SITE.description)}">
<meta name="theme-color" content="#e3262d">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(description || SITE.description)}">
<meta property="og:type" content="website">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${asset('/css/site.css')}">
${head}
</head>
<body class="${overlay ? 'has-overlay' : ''}">
<a class="skip" href="#main">跳到正文</a>
${header(active, overlay)}
<main id="main">
${body}
</main>
${footer()}
<script src="${asset('/js/site.js')}" defer></script>
${scripts}
</body>
</html>`;
}

module.exports = { page, lanesOf, hrefOf, catalogLeaves, ICON_ARROW, ICON_OUT };
