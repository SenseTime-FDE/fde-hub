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

/* 表单字段 */
function input(name, label, { type = 'text', required, value = {}, errors = {}, placeholder = '', max = 120, attrs = '' } = {}) {
  const err = errors[name];
  return `<label class="field${err ? ' has-error' : ''}"><span class="field-label">${esc(label)}${required ? '<i aria-hidden="true">*</i>' : ''}</span>
  <input type="${type}" name="${name}" value="${esc(value[name] || '')}" maxlength="${max}" ${required ? 'required' : ''} placeholder="${esc(placeholder)}" ${attrs} aria-invalid="${err ? 'true' : 'false'}">
  ${err ? `<span class="field-error">${esc(err)}</span>` : ''}</label>`;
}
function select(name, label, options, { required, value = {}, errors = {} } = {}) {
  const err = errors[name];
  const opts = options.map((o) => `<option value="${esc(o)}"${value[name] === o ? ' selected' : ''}>${esc(o)}</option>`).join('');
  return `<label class="field${err ? ' has-error' : ''}"><span class="field-label">${esc(label)}${required ? '<i aria-hidden="true">*</i>' : ''}</span>
  <select name="${name}" ${required ? 'required' : ''}><option value="">请选择</option>${opts}</select>
  ${err ? `<span class="field-error">${esc(err)}</span>` : ''}</label>`;
}
function textarea(name, label, { required, value = {}, errors = {}, placeholder = '', max = 2000 } = {}) {
  const err = errors[name];
  return `<label class="field field-wide${err ? ' has-error' : ''}"><span class="field-label">${esc(label)}${required ? '<i aria-hidden="true">*</i>' : ''}</span>
  <textarea name="${name}" rows="4" maxlength="${max}" ${required ? 'required' : ''} placeholder="${esc(placeholder)}">${esc(value[name] || '')}</textarea>
  ${err ? `<span class="field-error">${esc(err)}</span>` : ''}</label>`;
}
function checks(name, label, options, { value = {}, errors = {}, required } = {}) {
  const sel = new Set([].concat(value[name] || []).flatMap((v) => String(v).split('、')));
  const err = errors[name];
  return `<fieldset class="field field-wide${err ? ' has-error' : ''}" data-checks="${name}"><legend class="field-label">${esc(label)}${required ? '<i aria-hidden="true">*</i>' : ''}</legend><div class="chips">${options.map((o) => `<label class="chip"><input type="checkbox" name="${name}" value="${esc(o)}"${sel.has(o) ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>${err ? `<span class="field-error">${esc(err)}</span>` : ''}</fieldset>`;
}
const hidden = (csrf) => `<input type="hidden" name="_t" value="${esc(csrf)}"><div class="hp" aria-hidden="true"><label>请勿填写<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
const consent = (errors = {}) => `<label class="consent${errors.consent ? ' has-error' : ''}"><input type="checkbox" name="consent" value="1" required><span>我已阅读并同意<a href="/privacy" target="_blank">隐私说明</a>，同意商汤生态渠道团队就本次提交与我联系。</span></label>${errors.consent ? `<span class="field-error">${esc(errors.consent)}</span>` : ''}`;
const formError = (errors = {}) => (errors._form ? `<div class="form-alert" role="alert">${esc(errors._form)}</div>` : '');

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

/* ---------- 加入生态 ---------- */
function partners({ csrf, value = {}, errors = {} }) {
  const P = C.PARTNER;
  const body = pageHead({ en: 'PARTNERS', cn: '加入生态', t1: P.title1, t2: P.title2, lead: P.lead, ctas: [{ href: '#apply', label: '申请加入生态渠道', primary: true, icon: ` ${ICON_OUT}` }, { href: '#identity', label: '体验身份' }] })
  + `<section class="section">
  <div class="wrap">
    ${secHead('01', '加入生态', 'PARTNERS', '三种伙伴身份，可单选，可多选', P.typesLead)}
    <div class="grid-3">${P.types.map((t) => `<article class="card ptype" data-ptype="${t.key}"><p class="entry-en">${esc(t.en)}</p><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><ul class="red-dots">${t.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><p class="ptype-have">适合：${esc(t.have)}</p></article>`).join('')}</div>
    <p class="mission">${esc(P.line)}</p>
  </div>
</section>
<section class="section bg-soft" id="identity">
  <div class="wrap identity">
    <div>
      ${secHead('', '体验身份', 'WHO ARE YOU', esc(P.identity.title), P.identity.lead)}
      <div class="id-options" role="group" aria-label="你手里有什么">${P.identity.options.map((o) => `<button type="button" class="id-opt" data-id="${o.key}" aria-pressed="false"><b>${esc(o.label)}</b><small>${esc(o.hint)}</small></button>`).join('')}</div>
    </div>
    <div class="id-result card" data-id-result aria-live="polite">
      <p class="entry-en">YOUR PATH</p>
      <h3 data-id-title>先选一个，看看适合你的身份</h3>
      <ul class="id-list" data-id-list>${P.types.map((t) => `<li data-id-item="${t.key}"><b>${esc(t.have)}</b> → ${esc(t.title)}</li>`).join('')}</ul>
      <a class="btn btn-red" href="#apply" data-id-apply>带着这个身份去申请 ${ICON_ARROW}</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    ${secHead('02', '如何加入', 'GET STARTED', esc(P.stepsTitle), P.stepsLead)}
    <div class="grid-4 steps-big">${P.steps.map((s, i) => `<article class="card step-big"><span>${pad2(i + 1)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div>
  </div>
</section>
<section class="section bg-accent" id="model">
  <div class="wrap">
    ${secHead('03', '核心商业模式', 'BUSINESS MODEL', P.model.title, '')}
    <div class="model-grid">
      <div class="model-col"><h3>4+N+X · 车从哪里来</h3>${P.model.car.map((c) => `<div class="model-row"><b>${esc(c.tag)}</b><span>${esc(c.text)}</span></div>`).join('')}</div>
      <div class="model-col model-fuel"><h3>加油送车 · 钱从哪里来</h3>${P.model.fuel.map((c) => `<div class="model-row"><b>${esc(c.tag)}</b><span>${esc(c.text)}</span></div>`).join('')}</div>
    </div>
    <div class="sub-head"><h3>各方做什么、得到什么</h3></div>
    ${pTable(P.model.roles.head, P.model.roles.rows)}
    ${band({ label: '一句话', text: P.model.line })}
  </div>
</section>
<section class="section" id="isv">
  <div class="wrap">
    ${secHead('04', '伙伴 ISV 加入', 'PARTNER ISV', P.isv.title, '')}
    <div class="p-cards cols-3">${P.isv.values.map(pCard).join('')}</div>
    <div class="sub-head"><h3>六步：从签约到结算</h3></div>
    ${pSteps(P.isv.steps)}
    ${band({ label: '核心价值', text: P.isv.band })}
  </div>
</section>
<section class="section bg-soft" id="apply">
  <div class="wrap form-wrap">
    <div class="form-intro">${secHead('05', '申请加入', 'JOIN US', '提交伙伴申请', '提交后，顾问将通过企业微信与你对接，并邀请你进入生态渠道伙伴社群。合作政策与收益按合作协议约定。')}</div>
    <form class="form card" method="post" action="/partners" novalidate data-form>
      ${hidden(csrf)}${formError(errors)}
      <div class="form-grid">
        ${checks('partner_type', '伙伴身份（可多选）', P.typeOptions, { value, errors, required: true })}
        ${checks('has_what', '你手里有什么（可多选）', P.haveOptions, { value, errors })}
        ${input('company', '公司名称', { required: true, value, errors })}
        ${input('contact', '联系人', { required: true, value, errors, max: 40 })}
        ${input('title', '职务', { value, errors, max: 40 })}
        ${input('phone', '手机号', { type: 'tel', required: true, value, errors, max: 20, attrs: 'inputmode="tel" autocomplete="tel"' })}
        ${input('email', '工作邮箱', { type: 'email', value, errors, attrs: 'autocomplete="email"' })}
        ${input('city', '所在城市', { value, errors, max: 40 })}
        ${select('team_size', '团队规模', P.sizeOptions, { value, errors })}
        ${input('industries', '深耕行业', { value, errors, placeholder: '例如：金融、制造、零售' })}
        ${textarea('intro', '公司与合作设想', { value, errors, placeholder: '主营业务、已有客户行业、希望与商汤合作的方向' })}
      </div>
      ${consent(errors)}
      <button class="btn btn-red btn-lg" type="submit">提交申请</button>
    </form>
  </div>
</section>`;
  return page({ title: '加入生态', active: 'partners', body });
}

/* ---------- 市场活动 ---------- */
function events({ upcoming = [], past = [], kind = '' }) {
  const E = C.EVENTS;
  const tabs = ['全部', ...C.EVENT_KINDS].map((k) => {
    const v = k === '全部' ? '' : k;
    return `<a class="tab${v === kind ? ' on' : ''}" href="/events${v ? `?kind=${encodeURIComponent(v)}` : ''}#upcoming">${esc(k)}</a>`;
  }).join('');
  const highlights = past.length ? `<section class="section">
  <div class="wrap">
    ${secHead('01', '精彩回顾', 'EVENT HIGHLIGHTS', '市场活动集锦', E.highlightsLead)}
    <div class="grid-4 highlights">${past.slice(0, 8).map((e) => eventCard(e, { past: true })).join('')}</div>
  </div>
</section>` : '';
  const body = pageHead({ en: E.kicker, cn: '市场活动', t1: E.title1, t2: E.title2, tags: E.tags, ctas: [{ href: '#upcoming', label: '报名参与活动', primary: true }] })
  + highlights
  + `<section class="section${past.length ? ' bg-soft' : ''}" id="upcoming">
  <div class="wrap">
    ${secHead(past.length ? '02' : '01', '即将举办', 'UPCOMING', '近期活动与报名', '报名后我们会把参会信息发送给你。')}
    <nav class="tabs" aria-label="活动类型">${tabs}</nav>
    ${upcoming.length ? `<div class="grid-3">${upcoming.map((e) => eventCard(e)).join('')}</div>` : `<div class="empty"><p>近期活动正在筹备中。留下联系方式，活动发布后第一时间通知你。</p><a class="btn btn-ghost" href="/contact?from=events">订阅活动通知</a></div>`}
  </div>
</section>
<section class="section">
  <div class="wrap">
    ${secHead(past.length ? '03' : '02', '活动类型', 'JOIN US', '总有一场活动适合你', '无论你想了解行业趋势、走进商汤，还是与同行和生态伙伴深入交流，都能找到适合你的参与方式。')}
    <div class="grid-4">${E.types.map((t) => `<article class="card etype"><p class="entry-en">${esc(t.en)}</p><h3>${esc(t.title)}</h3><p class="etype-sub">${esc(t.sub)}</p><p>${esc(t.text)}</p></article>`).join('')}</div>
    <div class="card onsite"><div><p class="entry-en">ON-SITE · 现场体验</p><h3>${esc(E.onsiteTitle)}</h3><p>${esc(E.onsiteText)}</p></div><ol class="onsite-flow">${E.onsite.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
  </div>
</section>
<section class="section bg-soft">
  <div class="wrap">
    ${secHead(past.length ? '04' : '03', '参会收获', 'WHAT YOU GET', '参加活动，你将获得什么', '')}
    <div class="grid-3">${E.gains.map((g) => `<article class="card"><p class="entry-en">${esc(g.en)}</p><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p></article>`).join('')}</div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    ${secHead(past.length ? '05' : '04', '活动内容', 'WHAT YOU LEARN', '来到现场，可以学到什么', '')}
    <div class="grid-3">${E.learn.map((l, i) => `<article class="card learn"><span class="learn-no">${pad2(i + 1)}</span><h3>${esc(l.title)}</h3><p>${esc(l.text)}</p></article>`).join('')}</div>
  </div>
</section>
<section class="section bg-soft">
  <div class="wrap">
    ${secHead(past.length ? '06' : '05', '报名参与', 'REGISTRATION', '从这里出发，走进 AI 现场', '在活动详情页填写报名信息，三步完成。')}
    <div class="grid-3">${E.regSteps.map((s, i) => `<article class="card reg-step"><span class="learn-no">${pad2(i + 1)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div>
  </div>
</section>` + ctaBox(E.finalTitle, '关注即将举办的活动，或订阅活动通知，第一时间收到邀请。', { href: '#upcoming', label: '报名参与活动' });
  return page({ title: '市场活动', active: 'events', body });
}

function eventDetail({ ev, csrf, value = {}, errors = {}, past, full }) {
  const canReg = !past && ev.reg_open && !full;
  const body = pageHead({ en: 'EVENTS', cn: ev.kind, t1: ev.title, lead: ev.summary || '' })
  + `<section class="section">
  <div class="wrap detail-grid">
    <article class="detail-body">
      ${ev.cover ? `<img class="detail-cover" src="/media/events/${esc(ev.cover)}" alt="${esc(ev.title)}" width="960" height="540">` : ''}
      <dl class="meta-list">
        <div><dt>时间</dt><dd>${fmtDate(ev.starts_at)}${ev.ends_at ? ` — ${fmtDate(ev.ends_at)}` : ''}</dd></div>
        ${ev.city ? `<div><dt>城市</dt><dd>${esc(ev.city)}</dd></div>` : ''}
        ${ev.venue ? `<div><dt>地点</dt><dd>${esc(ev.venue)}</dd></div>` : ''}
        <div><dt>类型</dt><dd>${esc(ev.kind)}</dd></div>
      </dl>
      <div class="prose">${paras(ev.body)}</div>
    </article>
    <aside class="detail-side">
      ${canReg ? `<form class="form card" method="post" action="/events/${esc(ev.slug)}" novalidate data-form>
        <h2>报名参加</h2>
        ${hidden(csrf)}${formError(errors)}
        ${input('name', '姓名', { required: true, value, errors, max: 40 })}
        ${input('phone', '手机号', { type: 'tel', required: true, value, errors, max: 20, attrs: 'inputmode="tel" autocomplete="tel"' })}
        ${input('company', '公司', { required: true, value, errors })}
        ${input('title', '职位', { value, errors, max: 40 })}
        ${input('email', '邮箱', { type: 'email', value, errors })}
        ${consent(errors)}
        <button class="btn btn-red btn-block" type="submit">提交报名</button>
      </form>` : `<div class="card side-note"><h2>${past ? '活动已结束' : (full ? '报名已满' : '报名已关闭')}</h2><p>关注后续活动，或与我们联系。</p><a class="btn btn-ghost btn-block" href="/contact?from=events">订阅活动通知</a></div>`}
    </aside>
  </div>
</section>`;
  return page({ title: ev.title, description: ev.summary, active: 'events', body });
}

/* ---------- 人才招聘 ---------- */
function careers({ jobs = [], q = {}, allJobs = jobs }) {
  const K = C.CAREERS;
  const cities = [...new Set(allJobs.map((j) => j.city))];
  const total = allJobs.length;
  const body = pageHead({ en: 'CAREERS', cn: '人才招聘', t1: K.title1, t2: K.title2, lead: K.lead, tags: K.tags,
    ctas: [{ href: '#jobs', label: total ? `查看 ${total} 个岗位 ↓` : '查看在招岗位 ↓', primary: true }, { href: '#quiz', label: '体验简历选择' }] })
  + `<section class="section">
  <div class="wrap team">
    <div>
      ${secHead('01', 'SENSETIME FDE', '团队定位', esc(K.teamTitle), K.teamText)}
      <blockquote class="quote">${esc(K.teamQuote)}</blockquote>
    </div>
    <ol class="team-points">${K.teamPoints.map((t, i) => `<li><span>${pad2(i + 1)}</span><div><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div></li>`).join('')}</ol>
  </div>
</section>
<section class="section bg-soft">
  <div class="wrap">
    ${secHead('02', '岗位方向', 'ROLE MAP', esc(K.roleTitle), K.roleLead)}
    <div class="grid-4">${K.roles.map((r) => `<article class="card role" data-role="${r.key}"><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p><a class="link-arrow" href="/careers?q=${encodeURIComponent(r.keyword)}#jobs">看相关岗位 ${ICON_ARROW}</a></article>`).join('')}</div>
    <div class="quiz card" id="quiz">
      <h3>${esc(K.quiz.title)}</h3>
      <div class="id-options" role="group" aria-label="你更想做哪件事">${K.quiz.options.map((o) => `<button type="button" class="id-opt" data-role-opt="${o.key}" aria-pressed="false"><b>${esc(o.label)}</b></button>`).join('')}</div>
      <p class="quiz-result" data-role-result aria-live="polite">选一项，我们推荐适合你的岗位方向。</p>
    </div>
  </div>
</section>
<section class="section" id="jobs">
  <div class="wrap">
    ${secHead('03', '在招职位', 'OPEN ROLES', '找到适合你的位置', '')}
    <form class="filters" method="get" action="/careers#jobs">
      <input type="search" name="q" value="${esc(q.q || '')}" placeholder="搜索职位关键词" maxlength="40" aria-label="搜索职位关键词">
      <select name="kind" aria-label="招聘类型"><option value="">全部类型</option>${K.kinds.map((k) => `<option${q.kind === k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>
      <select name="city" aria-label="城市"><option value="">全部城市</option>${[...new Set([...cities, ...(q.city ? [q.city] : [])])].map((c) => `<option${q.city === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <button class="btn btn-outline" type="submit">筛选</button>
    </form>
    ${jobs.length ? `<ul class="job-list">${jobs.map((j) => `<li><a href="/careers/${j.id}"><div><b>${esc(j.title)}</b><span>${esc(j.summary || '')}</span></div><div class="job-tags"><em>${esc(j.city)}</em><em>${esc(j.kind)}</em>${j.team ? `<em>${esc(j.team)}</em>` : ''}</div>${ICON_ARROW}</a></li>`).join('')}</ul>`
      : `<div class="empty"><p>${q.q || q.kind || q.city ? '没有找到符合条件的职位，换个条件试试。' : '职位正在更新中。欢迎先联系我们，说说你想做什么。'}</p><a class="btn btn-ghost" href="/contact?from=careers">联系我们</a></div>`}
  </div>
</section>`;
  return page({ title: '人才招聘', active: 'careers', body });
}

function jobDetail({ job, csrf, value = {}, errors = {} }) {
  const K = C.CAREERS;
  const body = pageHead({ en: 'CAREERS', cn: job.kind, t1: job.title, lead: `${job.city}${job.team ? ` · ${job.team}` : ''}${job.headcount ? ` · 招聘 ${job.headcount} 人` : ''}` })
  + `<section class="section">
  <div class="wrap detail-grid">
    <article class="detail-body prose">
      ${job.summary ? `<p class="lead">${esc(job.summary)}</p>` : ''}
      ${lines(job.duties).length ? `<h2>岗位职责</h2><ul>${lines(job.duties).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      ${lines(job.requirements).length ? `<h2>任职要求</h2><ul>${lines(job.requirements).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      <p><a class="link-arrow" href="/careers#jobs">返回职位列表 ${ICON_ARROW}</a></p>
    </article>
    <aside class="detail-side">
      <form class="form card" method="post" action="/careers/${job.id}" enctype="multipart/form-data" novalidate data-form>
        <h2>投递简历</h2>
        ${hidden(csrf)}${formError(errors)}
        ${input('name', '姓名', { required: true, value, errors, max: 40 })}
        ${input('phone', '手机号', { type: 'tel', required: true, value, errors, max: 20, attrs: 'inputmode="tel" autocomplete="tel"' })}
        ${input('email', '邮箱', { type: 'email', required: true, value, errors, attrs: 'autocomplete="email"' })}
        ${select('years', '工作年限', K.yearsOptions, { value, errors })}
        ${input('city', '期望城市', { value, errors, max: 40 })}
        <label class="field${errors.resume ? ' has-error' : ''}"><span class="field-label">简历附件<i aria-hidden="true">*</i></span><input type="file" name="resume" accept=".pdf,.doc,.docx" required><small class="field-hint">PDF / Word，10 MB 以内</small>${errors.resume ? `<span class="field-error">${esc(errors.resume)}</span>` : ''}</label>
        ${textarea('message', '想对我们说的', { value, errors, max: 1000 })}
        ${consent(errors)}
        <button class="btn btn-red btn-block" type="submit">提交投递</button>
      </form>
    </aside>
  </div>
</section>`;
  return page({ title: job.title, description: job.summary, active: 'careers', body });
}

/* ---------- 技术交流 ---------- */
function community({ csrf, value = {}, errors = {} }) {
  const M = C.COMMUNITY;
  const body = pageHead({ en: 'COMMUNITY', cn: '技术交流', t1: M.title1, t2: M.title2, lead: M.lead, ctas: [{ href: '#join', label: '申请加入技术交流群', primary: true, icon: ` ${ICON_OUT}` }] })
  + `<section class="section">
  <div class="wrap">
    ${secHead('01', '交流话题', 'TOPICS', '在社群里，我们聊这些', '')}
    <div class="grid-3">${M.topics.map((t, i) => `<article class="card learn"><span class="learn-no">${pad2(i + 1)}</span><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></article>`).join('')}</div>
  </div>
</section>
<section class="section bg-soft" id="join">
  <div class="wrap form-wrap">
    <div class="form-intro">
      ${secHead('02', '如何加入', 'JOIN', '三步进入技术交流社群', '')}
      <ol class="mini-steps">${M.steps.map((s) => `<li><b>${esc(s.title)}</b><span>${esc(s.text)}</span></li>`).join('')}</ol>
    </div>
    <form class="form card" method="post" action="/community" novalidate data-form>
      ${hidden(csrf)}${formError(errors)}
      <div class="form-grid">
        ${input('name', '姓名', { required: true, value, errors, max: 40 })}
        ${input('company', '公司 / 团队', { required: true, value, errors })}
        ${select('title', '你的角色', M.roleOptions, { value, errors })}
        ${input('phone', '手机号（企业微信）', { type: 'tel', required: true, value, errors, max: 20, attrs: 'inputmode="tel" autocomplete="tel"' })}
        ${input('email', '邮箱', { type: 'email', value, errors, attrs: 'autocomplete="email"' })}
        ${input('city', '所在城市', { value, errors, max: 40 })}
        ${checks('interest', '关心的话题', M.topicOptions, { value })}
        ${textarea('message', '想交流的问题', { value, errors, placeholder: '例如：在 Raccoon X 上搭建销售助理时如何配置 Skill' })}
      </div>
      ${consent(errors)}
      <button class="btn btn-red btn-lg" type="submit">提交申请</button>
    </form>
  </div>
</section>`;
  return page({ title: '技术交流', active: 'community', body });
}

/* ---------- 预约演示 ---------- */
function contact({ csrf, value = {}, errors = {} }) {
  const K = C.CONTACT;
  const body = pageHead({ en: 'DEMO', cn: '预约演示', t1: '预约演示', t2: '咨询合作', lead: K.lead })
  + `<section class="section">
  <div class="wrap form-wrap">
    <div class="form-intro">
      ${secHead('', '跟进方式', 'NEXT STEPS', '我们会怎么跟进', '')}
      <ol class="mini-steps"><li><b>需求沟通</b><span>了解你的业务场景与痛点</span></li><li><b>产品演示</b><span>按场景演示小浣熊企服版</span></li><li><b>方案与试点</b><span>选一个场景，共同确认验证指标与基线</span></li></ol>
    </div>
    <form class="form card" method="post" action="/contact" novalidate data-form>
      ${hidden(csrf)}${formError(errors)}
      <input type="hidden" name="source" value="${esc(value.source || '')}">
      <div class="form-grid">
        ${input('name', '姓名', { required: true, value, errors, max: 40 })}
        ${input('company', '公司名称', { required: true, value, errors })}
        ${input('title', '职务', { value, errors, max: 40 })}
        ${input('phone', '手机号', { type: 'tel', required: true, value, errors, max: 20, attrs: 'inputmode="tel" autocomplete="tel"' })}
        ${input('email', '工作邮箱', { type: 'email', value, errors, attrs: 'autocomplete="email"' })}
        ${input('city', '所在城市', { value, errors, max: 40 })}
        ${select('industry', '所属行业', K.industries, { value, errors })}
        ${checks('interest', '感兴趣的产品与服务', K.interests, { value })}
        ${textarea('message', '想解决的问题', { value, errors, placeholder: '例如：销售过程看不见、项目交付管不住、想让团队用上 Agent' })}
      </div>
      ${consent(errors)}
      <button class="btn btn-red btn-lg" type="submit">提交</button>
    </form>
  </div>
</section>`;
  return page({ title: '预约演示', active: '', body });
}

const THANKS = {
  lead: ['已收到你的预约', '生态渠道团队会尽快与你联系，安排产品演示与方案沟通。'],
  partner: ['已收到你的伙伴申请', '顾问将通过企业微信与你对接，并邀请你进入生态渠道伙伴社群。'],
  community: ['已收到你的入群申请', '顾问将通过企业微信与你联系，邀请你进入生态渠道技术交流群。'],
  event: ['报名成功', '参会信息会发送到你留下的联系方式，请留意。'],
  job: ['投递成功', '我们会认真阅读你的简历，合适的话会尽快与你联系。'],
};
function thanks(kind) {
  const t = THANKS[kind] || THANKS.lead;
  const body = `<section class="section thanks"><div class="wrap narrow"><div class="thanks-mark" aria-hidden="true">✓</div><h1>${esc(t[0])}</h1><p class="lead">${esc(t[1])}</p><div class="btn-row center"><a class="btn btn-red" href="/">返回首页</a><a class="btn btn-ghost" href="/solutions">了解产品与方案</a></div></div></section>`;
  return page({ title: t[0], body });
}

function privacy() {
  const body = pageHead({ en: 'PRIVACY', cn: '隐私说明', t1: '我们如何处理你提交的信息' })
  + `<section class="section"><div class="wrap narrow prose">
  <p>本网站由${esc(C.SITE.sign)}运营。你在「预约演示」「加入生态」「技术交流」「市场活动报名」「人才招聘投递」中提交的信息，仅用于与你联系、安排演示与活动、邀请入群、评估合作与招聘。</p>
  <h2>我们收集什么</h2><p>你主动填写的姓名、公司、职务、联系方式、城市、行业与留言；投递职位时你上传的简历附件。我们不通过本网站收集你的身份证件号码、银行卡等信息。</p>
  <h2>谁能看到</h2><p>只有生态渠道团队中负责对应事项的同事可以在管理后台查看：线索、伙伴申请、入群申请与活动报名由市场同事处理，简历由招聘同事处理。我们不会出售你的信息。</p>
  <h2>保存多久</h2><p>信息在完成联系、活动或招聘流程所需的期限内保存；你可以随时联系我们要求查询、更正或删除。</p>
  <h2>Cookie</h2><p>本网站只使用必要的 Cookie，用于防止表单被冒用和维持后台登录，不用于广告追踪。</p>
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

module.exports = { home, solutions, product, cloudMaas, partners, events, eventDetail, careers, jobDetail, community, contact, thanks, privacy, notFound, errorPage, fmtDate };
