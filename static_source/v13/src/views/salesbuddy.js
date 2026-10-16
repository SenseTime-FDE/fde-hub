'use strict';

const { esc } = require('../http');
const { asset } = require('../assets');
const { page, ICON_ARROW, ICON_OUT } = require('./layout');
const S = require('../salesbuddy-content');

const imgRoot = '/images/salesbuddy/';
const external = (href, label, cls = 'link-arrow', action = 'open-workspace') => `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener" data-sb-action="${esc(action)}">${esc(label)} ${ICON_OUT}</a>`;
const heading = (no, cn, en, title, lead) => `<div class="sec-head"><p class="kicker"><b>${no}</b>${cn}<i>·</i>${en}</p><h2 class="h-section">${title}</h2><p class="lead">${lead}</p></div>`;
const screenshot = (file, alt, caption, { hero = false, mobile = false } = {}) => `<figure class="sb-shot${hero ? ' sb-hero-shot' : ''}${mobile ? ' sb-phone' : ''}">
  ${!mobile ? '<div class="sb-window-bar" aria-hidden="true"><span class="sb-window-dots"><i></i><i></i><i></i></span><span>SalesBuddy · 销售小浣熊</span><span class="sb-window-label">产品界面</span></div>' : ''}
  <a href="${imgRoot}${file}" target="_blank" rel="noopener" class="sb-image-link" data-sb-zoom data-caption="${esc(caption)}" aria-label="放大查看：${esc(caption)}">
    <img src="${imgRoot}${file}" alt="${esc(alt)}" width="${mobile ? 878 : 1440}" height="${mobile ? 1791 : 1000}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    <span class="sb-enlarge" aria-hidden="true">放大查看 ↗</span>
  </a>
  <figcaption>${esc(caption)}</figcaption>
</figure>`;

function salesbuddy() {
  const hero = `<section class="sb-hero" id="sb-top">
    <div class="page-head-bg" aria-hidden="true"></div>
    <div class="wrap">
      <nav class="crumbs" aria-label="当前位置"><a href="/solutions">产品与方案</a><i>/</i><a href="/solutions/apps">AI 应用</a><i>/</i><b>SalesBuddy</b></nav>
      <div class="sb-hero-layout">
        <div class="sb-hero-copy">
          <p class="kicker"><span>SALESBUDDY</span><i>·</i><span>商汤销售小浣熊</span></p>
          <h1>记录每一次沟通，<br><em>让 AI 助力销售增长。</em></h1>
          <p class="sb-hero-lead">连接客户、商机、拜访与任务，<br>让销售工作有记录、有行动、可复盘。</p>
          <div class="btn-row"><a href="#sb-miniapp" class="btn btn-red btn-lg">探索销售小浣熊 ${ICON_ARROW}</a>${external(S.workspace, '进入 Web 工作台', 'btn btn-ghost btn-lg')}</div>
          <p class="sb-platforms"><span>微信小程序</span><i></i><span>Web 工作台</span><i></i><span>运营管理后台</span></p>
          <p class="sb-hero-footline"><span>记录事实</span><i>/</i><span>理解客户</span><i>/</i><span>协作执行</span></p>
        </div>
        <figure class="sb-hero-visual" aria-label="${esc(S.heroVideo.label)}">
          <div class="sb-hero-video-frame"><video id="sb-hero-video" data-sb-video muted loop playsinline controls preload="metadata" poster="${esc(S.heroVideo.poster)}" width="${S.heroVideo.width}" height="${S.heroVideo.height}" aria-label="${esc(S.heroVideo.label)}"><source src="${esc(S.heroVideo.src)}" type="video/mp4">当前浏览器不支持视频播放，可通过下方入口打开演示。</video></div>
          <figcaption><span>微信小程序 · 经营看板</span><div class="sb-hero-video-actions"><button type="button" data-sb-video-toggle aria-controls="sb-hero-video" hidden>播放演示</button></div></figcaption>
        </figure>
      </div>
    </div>
  </section>`;

  const nav = `<nav class="sb-subnav" aria-label="SalesBuddy 页面导航"><div class="wrap"><a class="sb-nav-brand" href="#sb-top">SalesBuddy<span>销售小浣熊</span></a><div class="sb-nav-links"><a href="#sb-miniapp">微信小程序</a><a href="#sb-capabilities">核心能力</a><a href="#sb-workflow">工作闭环</a><a href="#sb-roles">适用角色</a><a href="#sb-faq">常见问题</a></div></div></nav>`;

  const promise = `<section class="sb-intro"><div class="wrap sb-promises">
    <div><span>01 / 看清客户</span><h2>谁值得投入？</h2><p>客户档案与作战地图，让跟进有重点。</p></div>
    <div><span>02 / 理解进展</span><h2>商机卡在哪里？</h2><p>连接沟通事实与商机阶段，让判断有依据。</p></div>
    <div><span>03 / 协作执行</span><h2>下一步谁来做？</h2><p>把已确认的建议转为任务，让行动可追踪。</p></div>
  </div></section>`;

  const capabilities = `<section class="section sb-capabilities" id="sb-capabilities"><div class="wrap">
    ${heading('02', '核心能力', 'CAPABILITIES', '围绕销售的<em>每一个关键动作</em>', '从第一次接触客户，到一轮经营复盘，让业务信息沿着实际工作流程连接。')}
    <div class="sb-tabs" role="tablist" aria-label="五大核心能力">${S.capabilities.map((c, i) => `<button type="button" role="tab" id="sb-tab-${c.id}" aria-controls="sb-panel-${c.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}"><span>0${i + 1}</span>${esc(c.label)}</button>`).join('')}</div>
    <div class="sb-panels">${S.capabilities.map((c, i) => `<div class="sb-feature" role="tabpanel" id="sb-panel-${c.id}" aria-labelledby="sb-tab-${c.id}" tabindex="0"${i ? ' hidden' : ''}>
      <div class="sb-feature-copy"><p class="sb-eyebrow">${c.en}</p><h3>${esc(c.title).replace('，', '，<br>')}</h3><p>${esc(c.text)}</p><ul class="sb-checklist">${c.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="sb-outcome">${esc(c.outcome)}</p></div>
      ${screenshot(c.image, c.alt, c.caption)}
    </div>`).join('')}</div>
  </div></section>`;

  const workflow = `<section class="section bg-soft sb-workflow" id="sb-workflow"><div class="wrap">
    ${heading('03', '工作闭环', 'WORKFLOW', '一次跟进，<em>不止于一条记录。</em>', '让记录支持判断，让判断形成行动，让每一轮复盘成为下一次推进的起点。')}
    <ol class="sb-flow">${S.workflow.map(([title, text], i) => `<li><span class="sb-step">${String(i + 1).padStart(2, '0')}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol>
    <div class="sb-flow-end"><span>客户与商机贯穿全程</span><p>事实留痕 <i>→</i> 人工确认 <i>→</i> 协作执行 <i>→</i> 持续复盘</p></div>
  </div></section>`;

  const miniapp = `<section class="section sb-miniapp" id="sb-miniapp"><div class="wrap">
    <div class="sb-mini-heading">${heading('01', '微信小程序', 'SALES ON THE GO', '把销售工作，<em>装进口袋里。</em>', '拜访前看客户，沟通后记事实。无论在客户现场，还是拜访途中，下一步行动都在手边。')}<span class="sb-wechat-badge"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14.8 7.1c-1.7-3.4-7.5-3.8-10-.6-2.6 3.4-.3 6.5 1.4 7.2l-.5 2.1 2.4-1.3m3.3-6.2c4.9-3.3 10.6-.4 10.2 4-.2 2-1.4 3.4-3.3 4.2l.4 2-2.5-1.3c-7.3.9-9.2-5.8-4.8-8.9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="13" cy="11.5" r=".8" fill="currentColor"/><circle cx="18" cy="11.5" r=".8" fill="currentColor"/></svg>微信里的销售助手</span></div>
    <div class="sb-mini-showcase" id="sb-mini-showcase" data-mini-showcase role="region" aria-roledescription="轮播图" aria-label="微信小程序八大使用场景">
      <div class="sb-mini-toolbar"><span class="sb-mini-hint">拖动切换 · 点击放大 · 悬停暂停</span></div>
      <div class="sb-mini-caption"><button type="button" class="sb-mini-arrow" data-mini-prev aria-label="上一个小程序界面">${ICON_ARROW}</button><div class="sb-mini-caption-copy" aria-live="off" aria-atomic="true" data-mini-caption><span class="sb-mini-counter"><b data-mini-number>01</b><span>/ 08</span></span><h3 data-mini-title>${esc(S.miniappScreens[0].title)}</h3><p data-mini-description>${esc(S.miniappScreens[0].text)}</p></div><button type="button" class="sb-mini-arrow" data-mini-next aria-label="下一个小程序界面">${ICON_ARROW}</button></div>
      <div class="sb-mini-selectors" role="group" aria-label="选择小程序场景">${S.miniappScreens.map((s, i) => `<button type="button" data-mini-select="${i}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>
      <div class="sb-mini-meta"><p>小程序录屏增强图 · 界面细节以实际版本为准。</p><a class="link-arrow" data-mini-zoom data-sb-zoom href="${imgRoot}${S.miniappScreens[0].image}" data-caption="微信小程序 · ${esc(S.miniappScreens[0].title)}" data-alt="微信小程序 · ${esc(S.miniappScreens[0].title)}" target="_blank" rel="noopener">放大当前界面 ${ICON_OUT}</a></div>
      <div class="sb-mini-stage" data-mini-stage>
        <div class="sb-mini-floor" aria-hidden="true"></div>
        ${S.miniappScreens.map((s, i) => {
          const offset = i > S.miniappScreens.length / 2 ? i - S.miniappScreens.length : i;
          return `<button type="button" class="sb-mini-device" data-mini-card="${i}" data-mini-title="${esc(s.title)}" data-mini-text="${esc(s.text)}" data-distance="${Math.abs(offset)}" style="--mini-offset:${offset};--mini-depth:${Math.abs(offset)};--mini-angle:${-Math.sign(offset) * 32}deg" aria-label="${i === 0 ? '放大查看' : '切换到'}：${esc(s.title)}" tabindex="${i === 0 ? '0' : '-1'}"${i ? ' aria-hidden="true"' : ''}><span class="sb-mini-device-edge"><img src="${imgRoot}${s.image}" alt="微信小程序 · ${esc(s.title)}" width="878" height="1791" loading="lazy" decoding="async" draggable="false"></span><span class="sb-mini-device-label" aria-hidden="true">${esc(s.label)}</span></button>`;
        }).join('')}
      </div>
    </div>
    <div class="sb-mini-ai" id="sb-ai"><div><span>AI 随行，业务由你判断</span><h3>从沟通到行动，每一步有据可查。</h3></div><ol><li><b>01 整理沟通</b><p>保留客户反馈，核对结构化记录。</p></li><li><b>02 检查质量</b><p>补充缺失事实，确认后归档。</p></li><li><b>03 采纳建议</b><p>明确负责人和期限，再转为待办。</p></li></ol></div><p class="sb-mini-boundary">AI 质检评价记录质量，不代表成交概率；建议由业务人员核对与采纳。</p>
  </div></section>`;

  const roles = `<section class="section bg-soft sb-team" id="sb-roles"><div class="wrap">
    ${heading('04', '角色与协作', 'BUILT FOR YOUR TEAM', '各有分工，<em>围绕同一条业务线协作。</em>', '一线做好跟进，主管看清进展，运营与专业团队按权限参与。')}
    <div class="sb-roles">${S.roles.map((r, i) => `<article class="sb-role"><span class="sb-role-label">${r.tag}</span><span class="sb-role-no" aria-hidden="true">0${i + 1}</span><h3>${r.title}</h3><p>${r.text}</p><ul>${r.items.map(t => `<li>${t}</li>`).join('')}</ul></article>`).join('')}</div>
    <div class="sb-connections"><div><span class="sb-eyebrow">CONNECTED WORK</span><h3>在合适的入口，接续工作。</h3><p>Web 集中处理业务，小程序支持移动跟进，管理后台维护组织与协作规则。</p></div><div class="sb-connection-items"><p><b>工作报告与复盘</b><span>准备材料、生成草稿，经人工核对后保存与共享。</span></p><p><b>飞书多维表格</b><span>按企业配置同步业务记录，查看处理状态。</span></p><small>各端功能、数据范围与集成能力，以已发布版本、企业配置和账号权限为准。</small></div></div>
  </div></section>`;

  const faqSplit = Math.ceil(S.faq.length / 2);
  const faq = `<section class="section sb-faq" id="sb-faq"><div class="wrap">${heading('05', '常见问题', 'FAQ', '关于销售小浣熊，<em>你可能想了解。</em>', '从适用团队到实际协作，了解产品的使用方式与功能边界。')}<div class="sb-faq-grid">${[S.faq.slice(0, faqSplit), S.faq.slice(faqSplit)].map(items => `<div class="sb-faq-list">${items.map(([q, a]) => `<details><summary>${esc(q)}<span aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join('')}</div>`).join('')}</div></div></section>`;

  const related = `<aside class="sb-related-section" aria-label="相关产品与方案"><div class="wrap">
    <div class="sb-related"><span>继续了解商汤 AI 产品与方案</span><a href="/solutions/projectbuddy">ProjectBuddy 项目小浣熊 ${ICON_ARROW}</a><a href="/solutions/raccoon-x">Raccoon X 智能体平台 ${ICON_ARROW}</a><a href="/solutions">全部产品 ${ICON_ARROW}</a></div>
  </div></aside>`;

  const dialog = `<dialog class="sb-lightbox" aria-labelledby="sb-lightbox-title"><div class="sb-lightbox-bar"><p id="sb-lightbox-title">产品界面</p><button type="button" data-sb-close aria-label="关闭大图">关闭 <span aria-hidden="true">×</span></button></div><div class="sb-lightbox-body"><img alt=""></div></dialog>`;
  return page({
    title: 'SalesBuddy 销售小浣熊｜AI 销售助手', description: S.description, active: 'solutions',
    head: `<link rel="stylesheet" href="${asset('/css/salesbuddy.css')}">`,
    scripts: `<script src="${asset('/js/salesbuddy.js')}" defer></script>`,
    body: `<div class="sb-page">${hero}${nav}${promise}${miniapp}${capabilities}${workflow}${roles}${faq}${related}${dialog}</div>`,
  });
}

module.exports = { salesbuddy };
