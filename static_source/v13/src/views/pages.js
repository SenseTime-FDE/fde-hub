'use strict';
/**
 * 公开页面（服务端渲染）v1.2。版式沿用现站 allfde.com：居中两行大标题（藏青灰 ＋ 红）、网格底纹与暖色光晕、
 * 「01 中文 · ENGLISH」编号小标题；文案来自 content.js；活动、职位来自数据库。
 * 结构：首页整体介绍生态渠道 → 产品与方案（总览 ＋ 每款产品一页，与导航下拉同一份目录）→ 云端 MaaS（国内 · 海外 · 模型 · 服务）。
 */
const { esc } = require('../http');
const { page, lanesOf, hrefOf, catalogLeaves, ICON_ARROW, ICON_OUT } = require('./layout');
const C = require('../content');

/* ---------- 小部件 ---------- */
const fmtDate = (iso, withTime = true) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  const p = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t)?.value;
  return `${g('year')} 年 ${g('month')} 月 ${g('day')} 日${withTime ? ` ${g('hour')}:${g('minute')}` : ''}`;
};
const paras = (txt) => String(txt || '').split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const lines = (txt) => String(txt || '').split('\n').map((s) => s.replace(/^\s*[-·•]\s*/, '').trim()).filter(Boolean);
const arrowLink = (href, label) => `<a class="link-arrow" href="${href}">${esc(label)} ${ICON_ARROW}</a>`;
const pad2 = (n) => String(n).padStart(2, '0');

/** 版块标题：01 中文 · ENGLISH ＋ 大标题 ＋ 导语 */
function secHead(no, cn, en, title, lead, extra = '') {
  return `<div class="sec-head">
  <p class="kicker">${no ? `<b>${esc(no)}</b>` : ''}${cn ? `${esc(cn)}<i>·</i>` : ''}${esc(en)}</p>
  <h2 class="h-section">${title}</h2>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}${extra}
</div>`;
}

/** 标题里「A ＋ B」只在「＋」前断行，不把词拆开 */
const nwrap = (t) => (/ ＋ /.test(t) ? String(t).split(/ (?=＋ )/).map((x) => `<span class="nw">${esc(x)}</span>`).join(' ') : esc(t));

/** 内页页首：居中，—— ENGLISH · 中文；两行标题（第二行红色） */
function pageHead({ en, cn, t1, t2, lead, ctas = [], tags = [], tone = '', pre = '' }) {
  return `<section class="page-head ${tone}">
  <div class="page-head-bg" aria-hidden="true"></div>
  <div class="wrap">
    ${pre}
    <p class="kicker kicker-center"><span>${esc(en)}</span><i>·</i><span>${esc(cn)}</span></p>
    <h1><span>${nwrap(t1)}</span>${t2 ? `<em>${nwrap(t2)}</em>` : ''}</h1>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    ${ctas.length ? `<div class="btn-row center">${ctas.map((c) => `<a class="btn ${c.primary ? 'btn-red' : 'btn-outline'}" href="${c.href}"${c.ext ? ' target="_blank" rel="noopener"' : ''}>${esc(c.label)}${c.icon || ''}</a>`).join('')}</div>` : ''}
    ${tags.length ? `<p class="dot-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
  </div>
</section>`;
}

function ctaBox(title = C.CTA.title, text = C.CTA.text, cta = C.CTA.cta) {
  return `<section class="section cta-section">
  <div class="wrap"><div class="cta-box">
    <h2>${esc(title)}</h2>
    <p>${esc(text)}</p>
    <a class="btn btn-red btn-lg" href="${cta.href}">${esc(cta.label)} ${ICON_OUT}</a>
  </div></div>
</section>`;
}

function eventCard(e, { past } = {}) {
  const cover = e.cover ? `<img src="/media/events/${esc(e.cover)}" alt="${esc(e.title)}" loading="lazy" width="640" height="400">` : `<span class="event-ph">${esc(e.kind)}</span>`;
  return `<a class="card event-card" href="/events/${esc(e.slug)}">
  <div class="event-cover">${cover}</div>
  <div class="event-body">
    <span class="event-kind">${esc(e.kind)}</span>
    <h3>${esc(e.title)}</h3>
    <p class="event-meta">${fmtDate(e.starts_at, !past)}${e.city ? ` · ${esc(e.city)}` : ''}</p>
    ${e.summary && !past ? `<p>${esc(e.summary)}</p>` : ''}
    ${past ? '' : `<span class="link-arrow">${e.reg_open ? '立即报名' : '查看详情'} ${ICON_ARROW}</span>`}
  </div>
</a>`;
}

/* ---------- 共用：方案目录、横条、产品分节 ---------- */
const catItem = (i) => `<a class="cat-item" href="${hrefOf(i)}"><b>${esc(i.name)}</b><span>${esc(i.text)}</span>${ICON_ARROW}</a>`;
const subLabel = (x) => `<p class="cat-sub-label">${x.slug ? `<a href="/solutions/${x.slug}">${esc(x.label)}</a>` : esc(x.label)}${x.note ? `<small>${esc(x.note)}</small>` : ''}</p>`;
/** 商汤 AI 全栈方案目录：小浣熊企服版（AI 应用主卡 ＋「商汤小浣熊 · 4」「伙伴 ISV · N＋X」两组，平台一列）＋ 全栈延伸 ＋ 部署与服务 */
function catalogGrid() {
  const lane = (l, k) => `<div class="cat-lane lane-${k + 1}">${l.map((i) => catItem(i) + (i.subs ? `<div class="cat-subs">${i.subs.map((x) => `<div class="cat-sub">${subLabel(x)}${x.items.map(catItem).join('')}</div>`).join('')}</div>` : '')).join('')}</div>`;
  return `<div class="catalog">${C.CATALOG.map((g) => `<div class="cat-group cat-${g.key}">
    <div class="cat-head">${g.href ? `<a href="${g.href}"><b>${esc(g.title)}</b><small>${esc(g.en)}</small>${ICON_ARROW}</a>` : `<p><b>${esc(g.title)}</b><small>${esc(g.en)}</small></p>`}<span>${esc(g.note)}</span></div>
    ${lanesOf(g) ? `<div class="cat-lanes">${lanesOf(g).map(lane).join('')}</div>` : `<div class="cat-items">${g.items.map(catItem).join('')}</div>`}
  </div>`).join('')}</div>`;
}

/** 结论横条：label ＋ 文案（可含 <em>）＋ 可选链接 */
function band(b) {
  if (!b) return '';
  return `<div class="band">${b.label ? `<span class="band-label">${esc(b.label)}</span>` : ''}<p>${b.text}</p>${b.href ? arrowLink(b.href, b.more || '了解更多') : ''}</div>`;
}

function pCard(it) {
  const inner = `${it.cap ? `<p class="p-cap">${esc(it.cap)}</p>` : ''}<h3>${esc(it.title)}</h3>${it.text ? `<p>${esc(it.text)}</p>` : ''}${it.points ? `<ul class="red-dots">${it.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${it.foot ? `<p class="deploy-fit">${esc(it.foot)}</p>` : ''}${it.href ? `<span class="link-arrow">${esc(it.more || '查看产品')} ${ICON_ARROW}</span>` : ''}`;
  return it.href ? `<a class="card p-card" href="${it.href}">${inner}</a>` : `<article class="card p-card">${inner}</article>`;
}
function pSteps(items) {
  return `<ol class="p-steps">${items.map((it, i) => `<li><span class="p-step-no">${pad2(i + 1)}</span>${it.who ? `<span class="p-who">${esc(it.who)}</span>` : ''}<h3>${esc(it.title)}</h3>${it.text ? `<p>${esc(it.text)}</p>` : ''}${it.points ? `<ul class="red-dots">${it.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${it.out ? `<p class="p-out">产出：${esc(it.out)}</p>` : ''}</li>`).join('')}</ol>`;
}
function pTable(head, rows) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, j) => (j === 0 ? `<td><b>${esc(c)}</b></td>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function sectionBody(s) {
  if (s.type === 'cards') return `<div class="p-cards cols-${s.cols || 3}${s.tone === 'soft' ? ' soft' : ''}">${s.items.map(pCard).join('')}</div>`;
  if (s.type === 'steps') return pSteps(s.items);
  if (s.type === 'table') return pTable(s.head, s.rows);
  if (s.type === 'pains') {
    return `<div class="p-cards cols-3 pains">${s.items.map((it) => `<article class="card pain"><p class="pain-no">${esc(it.no)}</p><h3>${esc(it.title)}</h3><ul class="red-dots">${it.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><p class="p-tags"><span>对应</span>${it.mods.map((m) => (m.href ? `<a href="${m.href}">${esc(m.label)}</a>` : `<b>${esc(m.label)}</b>`)).join('')}</p></article>`).join('')}</div>`;
  }
  if (s.type === 'modules') {
    return `<div class="mods3">${s.cols.map((c) => `<article class="mod-col tone-${c.tone}"><a class="mod-head" href="${c.href}"><b>${esc(c.name)}</b><small>${esc(c.cn)}</small>${ICON_ARROW}</a><p class="mod-tag">${esc(c.tagline)}</p>${c.groups.map((g) => `<div class="mod-group"><p>${esc(g.cap)}</p><div class="mod-chips">${g.items.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}</article>`).join('')}</div>${s.base ? `<div class="base-band"><b>一套底座</b>${s.base.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}`;
  }
  if (s.type === 'value') {
    return `<div class="value-grid"><div class="hl-grid">${s.highlights.map((h, i) => `<article class="card hl"><span class="hl-no">${pad2(i + 1)}</span><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></article>`).join('')}</div><aside class="who-panel"><h3>对谁有什么价值</h3>${s.values.map((v) => `<div class="who-row"><b>${esc(v.who)}</b><span>${esc(v.text)}</span></div>`).join('')}</aside></div>`;
  }
  return '';
}
/** 产品页分节：band 与 attach 的分节并入上一节，其余每节一个 section，深浅交替；s.id 作锚点 */
function productSections(list = [], note = '') {
  const groups = [];
  for (const s of list) {
    const last = groups[groups.length - 1];
    if (s.type === 'band' && last) last.bands.push(s);
    else if (s.attach && last) last.extras.push(s);
    else groups.push({ s, extras: [], bands: s.type === 'band' ? [s] : [] });
  }
  return groups.map(({ s, extras, bands }, i) => `<section class="section${i % 2 === 0 ? ' bg-soft' : ''}"${s.id ? ` id="${s.id}"` : ''}>
  <div class="wrap">
    ${s.type === 'band' ? '' : secHead(pad2(i + 1), '', s.en, s.title, s.lead || '')}
    ${sectionBody(s)}
    ${extras.map((x) => `<div class="p-extra">${sectionBody(x)}</div>`).join('')}
    ${bands.map(band).join('')}
    ${note && i === groups.length - 1 ? `<p class="note">${esc(note)}</p>` : ''}
  </div>
</section>`).join('');
}

function ctaDual(title, text, primary, secondary) {
  return `<section class="section cta-section">
  <div class="wrap"><div class="cta-box">
    <h2>${esc(title)}</h2>
    <p>${esc(text)}</p>
    <div class="btn-row center"><a class="btn btn-red btn-lg" href="${primary.href}">${esc(primary.label)} ${ICON_ARROW}</a><a class="btn btn-outline btn-lg" href="${secondary.href}">${esc(secondary.label)}</a></div>
  </div></div>
</section>`;
}

/* ---------- 首页：整体介绍生态渠道 ---------- */
function home({ events = [] }) {
  const H = C.HERO; const A = C.ABOUT; const MP = C.MAP; const M = C.METHOD; const P = C.PARTNER; const CL = C.CLOUD;
  const hero = `<section class="hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="hero-in wrap">
    <div class="hero-copy">
      <p class="kicker kicker-center"><span>${esc(H.kicker)}</span></p>
      <h1 class="hero-title"><span>${H.line1.split(/ (?=AI )/).map((t) => `<span class="nw">${esc(t)}</span>`).join(' ')}</span><em>${esc(H.line2)}</em></h1>
      <p class="hero-sub">${esc(H.sub)}</p>
      <div class="btn-row center">${H.ctas.map((c) => `<a class="btn ${c.primary ? 'btn-red' : 'btn-outline'} btn-lg" href="${c.href}">${esc(c.label)}${c.primary ? ` ${ICON_OUT}` : ''}</a>`).join('')}</div>
      <p class="dot-tags">${H.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>
    </div>
  </div>
  <a class="hero-scroll" href="#about" aria-label="向下浏览"><span></span></a>
</section>`;

  const about = `<section class="section" id="about">
  <div class="wrap">
    ${secHead('01', '生态渠道是什么', 'WHO WE ARE', A.title, A.lead)}
    <div class="stats stats-4">${A.stats.map((s) => `<div class="stat"><b>${esc(s.num).replace(/X$/, '<em>X</em>')}</b><span><i>${esc(s.label)}</i> · ${esc(s.text)}</span></div>`).join('')}</div>
    <div class="grid-4 pillars">${A.pillars.map((p) => `<a class="card pillar" href="${p.href}"><p class="pillar-tag">${esc(p.tag)}</p><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><span class="link-arrow">了解更多 ${ICON_ARROW}</span></a>`).join('')}</div>
  </div>
</section>`;

  const ecoMap = `<section class="section bg-soft" id="ecosystem">
  <div class="wrap">
    ${secHead('02', '生态全景', 'ECOSYSTEM MAP', MP.title, MP.lead)}
    <div class="eco-map">${MP.cols.map((c, i) => `<div class="eco-col eco-${i}"><p class="eco-en">${esc(c.en)}</p><h3>${esc(c.title)}</h3><ul>${c.items.map((x) => `<li><b>${esc(x.b)}</b><span>${esc(x.t)}</span></li>`).join('')}</ul></div>`).join('<span class="eco-arrow" aria-hidden="true"></span>')}</div>
    ${band(MP.band)}
  </div>
</section>`;

  const supply = `<section class="section" id="solutions">
  <div class="wrap">
    ${secHead('03', '产品与方案', 'AI FULL STACK', '商汤 AI 全栈方案：<em>小浣熊企服版 ＋ 全栈延伸</em>', C.SOLUTIONS.lead, arrowLink('/solutions', '查看方案目录与整体架构'))}
    ${catalogGrid()}
  </div>
</section>`;

  const cloud = `<section class="section bg-accent" id="cloud">
  <div class="wrap">
    ${secHead('04', '云端 MaaS', 'CLOUD MAAS', '云端 MaaS：<em>国内、海外两个平台，开通即用</em>', CL.lead)}
    <div class="grid-2">${CL.platforms.map((p) => `<a class="card platform-mini" href="/cloud-maas#${p.id}"><p class="entry-en">${esc(p.en)}</p><h3>${esc(p.title)}</h3><p class="pf-sub">${esc(p.sub)}</p><p>${esc(p.text)}</p><span class="link-arrow">查看详情 ${ICON_ARROW}</span></a>`).join('')}</div>
    <div class="chips-lg cloud-chips">${CL.services.map((s) => `<span>${esc(s.title)} · ${esc(s.sub)}</span>`).join('')}</div>
    <div class="btn-row"><a class="btn btn-red" href="/cloud-maas">了解云端 MaaS ${ICON_ARROW}</a><a class="btn btn-outline" href="${CL.link.href}" target="_blank" rel="noopener">${esc(CL.link.label)} ${ICON_OUT}</a></div>
  </div>
</section>`;

  const partner = `<section class="section" id="partner">
  <div class="wrap">
    ${secHead('05', '怎么合作', 'PARTNERS', '三种伙伴身份，<em>可单选，可多选</em>', P.typesLead, arrowLink('/partners', '了解加入生态'))}
    <div class="grid-3">${P.types.map((t) => `<a class="card ptype" href="/partners#identity"><p class="entry-en">${esc(t.en)}</p><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><p class="ptype-have">适合：${esc(t.have)}</p></a>`).join('')}</div>
    <ol class="steps-row">${P.steps.map((s, i) => `<li><span>${pad2(i + 1)}</span><b>${esc(s.title)}</b><p>${esc(s.text)}</p></li>`).join('')}</ol>
  </div>
</section>`;

  const method = `<section class="section bg-soft">
  <div class="wrap">
    ${secHead('06', '打样与复制', 'HOW IT WORKS', esc(M.title), M.lead)}
    <div class="grid-4 steps-big">${M.steps.map((s, i) => `<article class="card step-big"><span>${pad2(i + 1)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div>
  </div>
</section>`;

  const grow = `<section class="section">
  <div class="wrap">
    ${secHead('07', '一起成长', 'GROW TOGETHER', '活动、交流与招聘', '')}
    <div class="grid-3 entries">${C.GROW.map((e) => `<a class="card entry" href="${e.href}"><p class="entry-en">${esc(e.en)}</p><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><span class="link-arrow">进入专页 ${ICON_ARROW}</span></a>`).join('')}</div>
    ${events.length ? `<div class="sub-head"><h3>近期活动</h3>${arrowLink('/events', '全部活动')}</div><div class="grid-3">${events.map((e) => eventCard(e)).join('')}</div>` : ''}
  </div>
</section>`;

  return page({
    active: 'home', overlay: true,
    body: hero + about + ecoMap + supply + cloud + partner + method + grow + ctaBox(),
  });
}

/** 整体架构：格子为 [名称, 小字]；frame 为真的相邻几层（小浣熊企服版）包进虚线框 */
function archHtml(rows) {
  const cell = (c) => `<span><b>${esc(c[0])}</b>${c[1] ? `<small>${esc(c[1])}</small>` : ''}</span>`;
  const row = (r) => `<div class="arch-row${r.tone ? ` tone-${r.tone}` : ''}">${r.href ? `<a class="arch-label" href="${r.href}">${esc(r.label)} ${ICON_ARROW}</a>` : `<span class="arch-label">${esc(r.label)}</span>`}<div class="arch-cells">${r.cells.map(cell).join('')}</div></div>`;
  let html = '';
  for (let i = 0; i < rows.length;) {
    if (!rows[i].frame) { html += row(rows[i]); i += 1; continue; }
    let j = i;
    while (j < rows.length && rows[j].frame) j += 1;
    html += `<div class="arch-frame"><span class="arch-frame-label">小浣熊企服版</span>${rows.slice(i, j).map(row).join('')}</div>`;
    i = j;
  }
  return `<div class="arch">${html}</div>`;
}

/* ---------- 产品与方案：总览（方案目录 · 整体架构 · 业务逻辑 · 部署形态） ---------- */
function solutions() {
  const S = C.SOLUTIONS;
  const body = pageHead({ en: 'SOLUTIONS', cn: '产品与方案', t1: S.title1, t2: S.title2, lead: S.lead })
  + `<section class="section" id="catalog">
  <div class="wrap">
    ${secHead('01', '方案目录', 'CATALOG', '商汤 AI 全栈方案目录', S.catalogLead)}
    ${catalogGrid()}
  </div>
</section>
<section class="section bg-soft" id="architecture">
  <div class="wrap">
    ${secHead('02', '整体架构', 'ARCHITECTURE', '企服版三层 ＋ <em>全栈延伸</em>', '虚线框里三层是小浣熊企服版，下面两层是全栈延伸；有对应产品的层可以点进产品介绍。')}
    ${archHtml(S.arch)}
    <p class="arch-band">${esc(S.archBand)}</p>
    <div class="base-band"><b>一套底座</b>${S.base.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="sub-head"><h3>业务逻辑：事情怎么流转</h3></div>
    ${pSteps(S.logic)}
  </div>
</section>
<section class="section" id="flow">
  <div class="wrap">
    ${secHead('03', '业务闭环', 'HOW IT FLOWS', '一条业务线，<em>怎样贯通各层</em>', S.loopLead)}
    ${pSteps(S.loop)}
    ${S.loopBands.map(band).join('')}
  </div>
</section>
<section class="section bg-soft">
  <div class="wrap">
    ${secHead('04', '部署形态', 'DEPLOYMENT', '私有化、云端 SaaS、混合', '同一套小浣熊企服版，按数据边界与已有算力选择。', arrowLink('/solutions/services', '看部署与落地陪跑'))}
    <div class="grid-3">${S.deploy.map((d) => `<article class="card deploy"><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p><p class="deploy-fit">适合：${esc(d.fit)}</p></article>`).join('')}</div>
  </div>
</section>` + ctaDual('选好产品，下一步看演示', '留下联系方式，生态渠道团队安排产品演示与方案沟通；伙伴也可以直接申请加入生态。', { href: '/contact?from=solutions', label: '预约演示' }, { href: '/partners#apply', label: '申请加入生态渠道' });
  return page({ title: '产品与方案', description: S.lead, active: 'solutions', body });
}

/* ---------- 产品介绍页 ---------- */
function product(slug) {
  const p = C.PRODUCTS[slug];
  if (!p) return null;
  const g = C.CATALOG.find((x) => x.key === p.group);
  const self = `/solutions/${slug}`;
  const parent = p.parent && C.PRODUCTS[p.parent];
  const crumbs = `<nav class="crumbs" aria-label="当前位置"><a href="/solutions">产品与方案</a><i>/</i>${g && g.href !== self ? (g.href ? `<a href="${g.href}">${esc(g.title)}</a>` : `<span>${esc(g.title)}</span>`) + '<i>/</i>' : ''}${parent ? `<a href="/solutions/${p.parent}">${esc(parent.name)}</a><i>/</i>` : ''}<b>${esc(p.name)}</b></nav>`;
  const val = (v) => (typeof v === 'string' ? esc(v) : `<b>${esc(v.title)}</b>：${esc(v.text)}`);
  const intro = `<section class="section">
  <div class="wrap">
    <p class="position">${esc(p.position)}</p>
    ${p.quote ? `<blockquote class="p-quote">「${esc(p.quote)}」</blockquote>` : ''}
    ${p.problems ? `<div class="onepager">
      <div class="op-col op-problem"><h2>解决什么问题</h2>${p.problems.map((x) => `<div class="op-item"><b>${esc(x.title)}</b><span>${esc(x.text)}</span></div>`).join('')}</div>
      <div class="op-col op-logic c-${p.color}"><h2>产品逻辑</h2>${p.logic.map((x, i) => `<div class="op-item"><i>${i + 1}</i><b>${esc(x.title)}</b><span>${esc(x.text)}</span></div>`).join('')}</div>
      <div class="op-col op-value"><h2>带来的价值</h2>${p.values.map((v) => `<div class="op-item"><b>✓</b><span>${val(v)}</span></div>`).join('')}</div>
    </div>` : ''}
  </div>
</section>`;
  const nSec = (p.sections || []).filter((s, i) => !((s.type === 'band' || s.attach) && i > 0)).length;
  const features = p.features ? `<section class="section${nSec % 2 === 0 ? ' bg-soft' : ''}">
  <div class="wrap">
    ${secHead(pad2(nSec + 1), '', 'FEATURES', '主要功能', '')}
    <div class="chips-lg">${p.features.map((f) => `<span>${esc(f)}</span>`).join('')}</div>
    ${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
  </div>
</section>` : '';
  const uniq = (list) => {
    const out = [];
    for (const l of list) {
      if (l.slug === slug || out.some((u) => u.slug === l.slug)) continue;
      out.push(l.anchor ? { slug: l.slug, name: C.PRODUCTS[l.slug].name, text: C.PRODUCTS[l.slug].cn } : l);
    }
    return out;
  };
  const pool = g ? uniq(catalogLeaves(g)) : [];
  const more = (pool.length >= 2 ? pool : uniq(C.CATALOG.flatMap(catalogLeaves))).slice(0, 6);
  const related = `<section class="section related">
  <div class="wrap">
    ${secHead('', '继续了解', 'MORE', '同一目录下的其他产品', '', arrowLink('/solutions', '查看全部方案目录'))}
    <div class="cat-items rel">${more.map((i) => `<a class="cat-item" href="/solutions/${i.slug}"><b>${esc(i.name)}</b><span>${esc(i.text)}</span>${ICON_ARROW}</a>`).join('')}</div>
  </div>
</section>`;
  const body = pageHead({ en: p.kicker, cn: g ? g.title : '产品与方案', t1: p.name, t2: p.cn, lead: p.slogan, pre: crumbs })
    + intro + productSections(p.sections, p.features ? '' : p.note) + features + related
    + ctaDual(`想看 ${p.name} 的演示？`, '留下联系方式，生态渠道团队安排产品演示与方案沟通；伙伴也可以直接申请加入生态。', { href: `/contact?from=${encodeURIComponent(slug)}`, label: '预约演示' }, { href: '/partners#apply', label: '申请加入生态渠道' });
  return page({ title: `${p.name} ${p.cn}`, description: p.position, active: 'solutions', body });
}

/* ---------- 云端 MaaS：国内平台 · 海外平台 · 服务 · 模型 · Token Plan · 开通与支付 ---------- */
function cloudMaas() {
  const CL = C.CLOUD;
  const dl = (rows) => `<dl class="kv">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const body = pageHead({ en: 'CLOUD MAAS', cn: '云端 MaaS', t1: CL.title1, t2: CL.title2, lead: CL.lead,
    ctas: [{ href: CL.link.href, label: '前往国内平台', primary: true, icon: ` ${ICON_OUT}`, ext: true }, { href: '/contact?from=cloud-maas', label: '咨询云端 MaaS' }],
    tags: ['国内平台', '海外平台', '智能体 · Token Plan · 模型 API'] })
  + `<section class="section" id="platforms">
  <div class="wrap">
    ${secHead('01', '两个平台', 'PLATFORMS', '国内、海外：<em>各自独立，同一种用法</em>', '两个平台都提供智能体（Raccoon X 编排）、Token Plan 与模型 API 全套能力；API 网关统一接入，Token Plan 统一计量。')}
    <div class="grid-2 platforms">${CL.platforms.map((p) => `<article class="card platform" id="${p.id}">
      <p class="entry-en">${esc(p.en)}</p><h3>${esc(p.title)}</h3><p class="pf-sub">${esc(p.sub)}</p><p>${esc(p.text)}</p>
      ${dl(p.rows)}
      <a class="btn ${p.cta.out ? 'btn-red' : 'btn-outline'}" href="${p.cta.href}"${p.cta.out ? ' target="_blank" rel="noopener"' : ''}>${esc(p.cta.label)} ${p.cta.out ? ICON_OUT : ICON_ARROW}</a>
    </article>`).join('')}</div>
    <div class="sub-head"><h3>怎么选</h3></div>
    <div class="p-cards cols-3 soft">${CL.choose.map((c) => pCard({ ...c, more: c.href ? '看 MaaS 平台私有化' : '' })).join('')}</div>
  </div>
</section>
<section class="section bg-soft" id="services">
  <div class="wrap">
    ${secHead('02', '服务', 'SERVICES', '三项服务，<em>一个平台全套提供</em>', '云端 MaaS 内含 Raccoon X 智能体编排能力：开发、发布与计量在一个平台完成。')}
    <div class="grid-3">${CL.services.map((s) => `<article class="card svc"><p class="entry-en">${esc(s.en)}</p><h3>${esc(s.title)}</h3><p class="pf-sub">${esc(s.sub)}</p><ul class="red-dots">${s.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div>
    <div class="sub-head"><h3>一次调用怎么走</h3></div>
    ${pSteps(CL.flow)}
  </div>
</section>
<section class="section" id="models">
  <div class="wrap">
    ${secHead('03', '模型', 'MODELS', '商汤自研和开源大模型 ＋ <em>第三方聚合大模型</em>', '一个 Key 接入，多模型可选：换模型只改模型名，业务代码不用动；用量透明，可查可追可对账。')}
    <div class="grid-2">${CL.models.map((m) => `<article class="card"><h3>${esc(m.title)}</h3>${dl(m.rows)}</article>`).join('')}</div>
    <div class="sub-head"><h3>能力类型</h3></div>
    <div class="chips-lg">${CL.modelTypes.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <p class="note">${esc(CL.modelNote)}</p>
  </div>
</section>
<section class="section bg-soft" id="token-plan">
  <div class="wrap">
    ${secHead('04', 'Token Plan', 'TOKEN PLAN', '按人订阅，<em>一份积分多处通用</em>', '跨模型、跨模态的统一额度：5 小时、每周、月度三层额度，额外用量开关由管理员按业务设置。')}
    <div class="p-cards cols-3">${CL.tokenPlan.map(pCard).join('')}</div>
    ${pTable(CL.tpTable.head, CL.tpTable.rows)}
    ${band({ label: '一句话', text: CL.tpLine })}
  </div>
</section>
<section class="section" id="start">
  <div class="wrap">
    ${secHead('05', '开通与支付', 'GET STARTED', '五步开通，<em>一个控制台管到底</em>', '')}
    ${pSteps(CL.start)}
    <div class="sub-head"><h3>控制台 · 八个入口</h3></div>
    <div class="chips-lg">${CL.console.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="grid-2 pay">${CL.pay.map((p) => `<article class="card"><h3>${esc(p.title)}</h3>${dl(p.rows)}</article>`).join('')}</div>
    <p class="note">${esc(CL.payNote)}</p>
  </div>
</section>
<section class="section bg-accent" id="accounts">
  <div class="wrap">
    ${secHead('06', '企业与伙伴', 'ENTERPRISES & PARTNERS', '企业把权益穿透到人，<em>伙伴用同一种结算</em>', '')}
    <div class="model-grid">
      <div class="model-col"><h3>企业 · 四层账户</h3>${CL.accounts.map((a) => `<div class="model-row"><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div>`).join('')}</div>
      <div class="model-col model-fuel"><h3>伙伴 · 同一种结算</h3>${CL.partners.map((c) => `<div class="model-row"><b>${esc(c.tag)}</b><span>${esc(c.text)}</span></div>`).join('')}</div>
    </div>
    <p class="model-line">数据必须留在企业内时，用国内版私有化部署：<a class="link-arrow" href="/solutions/maas">看 MaaS 平台 ${ICON_ARROW}</a></p>
  </div>
</section>` + ctaDual('开通云端 MaaS，或先聊聊', '国内平台注册即用；海外平台与企业采购，留下联系方式由生态渠道团队对接。', { href: '/contact?from=cloud-maas', label: '咨询云端 MaaS' }, { href: '/partners#apply', label: '申请加入生态渠道' });
  return page({ title: '云端 MaaS', description: CL.lead, active: 'cloud', body });
}

function privacy() {
  const body = pageHead({ en: 'PRIVACY', cn: '隐私说明', t1: '静态网站与外部提交说明' })
  + `<section class="section"><div class="wrap narrow prose">
  <p>本网站由${esc(C.SITE.sign)}运营，并通过 GitHub Pages 提供公开静态内容。网站本身不提供真实账号注册、后台登录、数据库表单或简历上传服务。</p>
  <h2>本网站本身不会收集什么</h2><p>技术内容搜索只在你的浏览器内运行，搜索词不会提交到本站服务器；招聘页的文件选择仅用于本地界面演示，不读取、不保存、也不上传文件内容。</p>
  <h2>外部提交入口</h2><p>「申请加入」「市场活动报名」等按钮可能打开商汤使用的外部落地页。只有当你在外部页面主动填写并提交信息时，相关平台和负责对接的团队才会收到这些内容；请以外部页面当时展示的隐私说明和字段为准。</p>
  <h2>浏览器本地数据</h2><p>部分演示页面可能使用浏览器本地存储保存体验身份或界面状态。这些数据不代表真实账号，也不会由本静态网站同步到服务端；你可以通过浏览器设置清除。</p>
  <h2>外部链接</h2><p>技术资讯原文、商汤官网及其他外部链接由对应网站独立运营。访问外部网站后，其日志、Cookie 与数据处理规则以对方说明为准。</p>
</div></section>`;
  return page({ title: '隐私说明', body });
}

function notFound() {
  const body = `<section class="section thanks"><div class="wrap narrow"><div class="thanks-mark muted" aria-hidden="true">404</div><h1>页面不存在</h1><p class="lead">你访问的页面可能已移动或删除。</p><div class="btn-row center"><a class="btn btn-red" href="/">返回首页</a></div></div></section>`;
  return page({ title: '页面不存在', body });
}
function errorPage(status, message) {
  const body = `<section class="section thanks"><div class="wrap narrow"><div class="thanks-mark muted" aria-hidden="true">${status}</div><h1>${esc(message || '出错了')}</h1><div class="btn-row center"><a class="btn btn-red" href="/">返回首页</a><a class="btn btn-ghost" href="/contact">联系我们</a></div></div></section>`;
  return page({ title: '出错了', body });
}

module.exports = { home, solutions, product, cloudMaas, privacy };
