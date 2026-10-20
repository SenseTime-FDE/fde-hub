'use strict';
const { page, ICON_ARROW } = require('./layout');
const { esc } = require('../http');
const { asset } = require('../assets');
const R = require('../raccoon-x-content');

const heading = (no, cn, en, title, lead) => `<div class="sec-head"><p class="kicker"><b>${no}</b>${cn}<i>·</i>${en}</p><h2 class="h-section">${title}</h2><p class="lead">${esc(lead)}</p></div>`;
const shot = (image, alt, caption, width, height, eager = false) => `<figure class="sb-shot${eager ? ' sb-hero-shot' : ''}">
  <div class="sb-window-bar"><span class="sb-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Raccoon X · 智能体平台</span><span class="sb-window-label">产品界面</span></div>
  <div class="rx-image"><img src="/img/raccoon-x/${image}" alt="${esc(alt)}" width="${width}" height="${height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div><figcaption>${esc(caption)}</figcaption>
</figure>`;

function raccoonX() {
  const hero = `<section class="sb-hero rx-hero" id="rx-top"><div class="page-head-bg" aria-hidden="true"></div><div class="wrap">
    <nav class="crumbs" aria-label="当前位置"><a href="/solutions">产品与方案</a><i>/</i><a href="/solutions/raccoonbuddy">小浣熊企服版</a><i>/</i><b>Raccoon X</b></nav>
    <div class="sb-hero-layout"><div class="sb-hero-copy"><p class="kicker">RACCOON X<i>·</i>智能体平台</p><h1>把 AI 能力，<br><em>变成业务生产力。</em></h1><p class="sb-hero-lead">将模型、知识、工具与工作方法，<br>组合成专业助手、专家团队和业务流程。</p><div class="btn-row"><a class="btn btn-red btn-lg" href="#rx-capabilities">探索 Raccoon X ${ICON_ARROW}</a><a class="btn btn-ghost btn-lg" href="/contact?from=raccoon-x">预约产品演示</a></div><p class="sb-platforms"><span>Agent</span><i></i><span>Agent Teams</span><i></i><span>Workflow / Chatflow</span></p><p class="sb-hero-footline"><span>能力可组合</span><i>/</i><span>经验可复用</span><i>/</i><span>应用可维护</span></p></div>
    <div class="rx-hero-visual">${shot('home.jpg', 'Raccoon X 首页，包含工作室、Agents、知识库、Skills、集成与业务模板', '从业务任务与应用模板开始，让 AI 接入日常工作。', 1280, 678, true)}<div class="rx-hero-tags"><span>专业助手</span><span>专家协作</span><span>可视化编排</span></div></div></div>
  </div></section>`;

  const nav = `<nav class="sb-subnav" aria-label="Raccoon X 页面导航"><div class="wrap"><a class="sb-nav-brand" href="#rx-top">Raccoon X<span>智能体平台</span></a><div class="sb-nav-links"><a href="#rx-capabilities">核心能力</a><a href="#rx-resources">业务资源</a><a href="#rx-scenarios">应用场景</a><a href="#rx-connect">接入与维护</a><a href="#rx-faq">常见问题</a></div></div></nav>`;

  const intro = `<section class="sb-intro"><div class="wrap sb-promises"><div><span>01 / 个人工作</span><h2>一个助手，承接专业任务。</h2><p>把整理、问答和起草交给有明确职责的 Agent。</p></div><div><span>02 / 多角色协作</span><h2>一支团队，汇集专家能力。</h2><p>由团长组织分工、检查意见并汇总成果。</p></div><div><span>03 / 重复业务</span><h2>一套流程，复用成熟做法。</h2><p>把稳定步骤编排起来，让同类任务有章可循。</p></div></div></section>`;

  const capabilities = `<section class="section sb-capabilities" id="rx-capabilities"><div class="wrap">
    ${heading('01', '核心能力', 'CAPABILITIES', '从一个助手，<em>到一套业务应用。</em>', '按任务的复杂度选择合适的方式，也可以让 Agent、专家团队与流程相互配合。')}
    <div class="sb-tabs rx-tabs" role="tablist" aria-label="Raccoon X 核心能力">${R.capabilities.map((c, i) => `<button type="button" role="tab" id="rx-tab-${c.id}" aria-controls="rx-panel-${c.id}" aria-selected="${i === 0}" aria-label="${esc(c.name)} · ${esc(c.category)}" tabindex="${i === 0 ? '0' : '-1'}"><span aria-hidden="true">0${i + 1}</span><b class="rx-tab-copy">${esc(c.category)}<small>${esc(c.name)}</small></b></button>`).join('')}</div>
    <div class="sb-panels">${R.capabilities.map((c, i) => `<div class="sb-feature" role="tabpanel" id="rx-panel-${c.id}" aria-labelledby="rx-tab-${c.id}" tabindex="0"${i ? ' hidden' : ''}><div class="sb-feature-copy"><p class="sb-eyebrow">${c.en}</p><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><ul class="sb-checklist">${c.points.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p class="sb-outcome">${esc(c.outcome)}</p></div>${shot(c.image, c.alt, c.caption, c.width, c.height)}</div>`).join('')}</div>
    <p class="sb-shot-note">产品界面来自演示环境，示例资料为虚构内容；功能与界面以交付版本和账号权限为准。</p>
  </div></section>`;

  const resources = `<section class="section bg-soft rx-resources" id="rx-resources"><div class="wrap">
    ${heading('02', '业务资源', 'SHARED CAPABILITIES', '把业务积累，<em>变成可复用的能力。</em>', '资料、方法与工具各司其职，让应用围绕同一套业务资源构建。')}
    <div class="rx-resource-grid">${R.resources.map(r => `<article class="rx-resource"><div class="rx-resource-top"><span>${r.en}</span><b>${r.no}</b></div><h3>${r.title}</h3><p class="rx-resource-question">${r.question}</p><p>${r.text}</p><ul>${r.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul></article>`).join('')}</div>
    <div class="rx-resource-base"><span>共同服务于你的业务应用</span><p><b>Agent</b><i>+</i><b>Agent Teams</b><i>+</i><b>Workflow / Chatflow</b></p></div>
  </div></section>`;

  const scenarios = `<section class="section rx-scenarios" id="rx-scenarios"><div class="wrap">
    ${heading('03', '应用场景', 'WORK IN PRACTICE', '从一份零散资料，<em>到一份可用的工作简报。</em>', '以业务资料整理为例：让 AI 整理和核对，让业务人员专注判断与下一步行动。')}
    <div class="rx-example"><div class="rx-example-input"><span class="sb-eyebrow">输入 · 一段会议资料</span><h3>星河书店<br>会员活动筹备</h3><p>两家门店试点，活动流程、场地和人员分别推进；报名页的负责人及日期待定。</p><div class="rx-source-lines"><p><span>预算金额</span><b>3 万元</b></p><p><span>审批状态</span><b>待审批</b></p></div><small>虚构业务示例</small></div><div class="rx-example-process"><div class="rx-example-label"><span>处理 · 按任务选择组合方式</span><span>结果 · 业务人员核实</span></div><ol class="rx-expert-flow"><li><span>01</span><b>提取事实</b><small>找出数字、日期与责任人</small></li><li><span>02</span><b>核对信息</b><small>标记缺失、矛盾与待确认项</small></li><li><span>03</span><b>整理成稿</b><small>合并意见，形成统一简报</small></li></ol><div class="rx-report"><span>资料摘要</span><span>关键事实</span><span>行动清单</span><span>待确认事项</span></div><p class="rx-example-note">保留“预算 3 万元”和“待审批”两项事实；缺少的负责人和日期仍标为“待确认”。</p></div></div>
    <div class="rx-use-cases"><span>同样适用于</span><p>销售材料准备</p><p>制度与产品问答</p><p>客户服务辅助</p><p>项目资料整理</p></div>
  </div></section>`;

  const connect = `<section class="section bg-soft rx-connect" id="rx-connect"><div class="wrap">
    ${heading('04', '接入与维护', 'BUILD · CONNECT · IMPROVE', '搭建之后，<em>在业务入口里用起来。</em>', '从一个边界清晰的小任务开始，逐步接入团队的日常工作，并通过反馈持续迭代。')}
    <ol class="sb-flow rx-flow">${R.workflow.map(([title, text], i) => `<li><span class="sb-step">0${i + 1}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol>
    <div class="sb-connections rx-connections"><div><span class="sb-eyebrow">CONNECTED WORK</span><h3>熟悉的入口，统一的应用能力。</h3><p>在中台维护助手与团队，在业务人员日常使用的入口交付能力。</p><div class="rx-channel-tags"><span>Web 应用</span><span>飞书</span><span>企业微信</span><span>钉钉</span><span>服务 API</span></div></div><div class="sb-connection-items"><p><b>发布与版本</b><span>把调试完成的配置发布为可使用版本，维护应用与团队的迭代记录。</span></p><p><b>日志与监控</b><span>查看执行过程、任务情况和用量指标，定位问题并调整配置。</span></p><p><b>工作空间</b><span>按工作空间组织应用和资源，结合成员角色开展协作。</span></p><small>消息渠道、模型与外部系统需完成相应配置、授权和联调。</small></div></div>
  </div></section>`;

  const faq = `<section class="section sb-faq" id="rx-faq"><div class="wrap">${heading('05', '常见问题', 'FAQ', '关于 Raccoon X，<em>你可能想了解。</em>', '选好起点，让应用围绕实际业务任务逐步生长。')}<div class="sb-faq-grid">${[R.faq.slice(0, 2), R.faq.slice(2)].map(items => `<div class="sb-faq-list">${items.map(([q, a]) => `<details><summary>${esc(q)}<span aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join('')}</div>`).join('')}</div></div></section>`;

  const related = `<aside class="sb-related-section" aria-label="相关产品与方案"><div class="wrap"><div class="sb-related"><span>继续了解商汤 AI 产品与方案</span><a href="/solutions/salesbuddy">SalesBuddy 销售小浣熊 ${ICON_ARROW}</a><a href="/solutions/maas">MaaS 平台 ${ICON_ARROW}</a><a href="/solutions">全部产品 ${ICON_ARROW}</a></div></div></aside>`;
  const cta = `<section class="section cta-section"><div class="wrap"><div class="cta-box"><p class="kicker">LET’S BUILD YOUR FIRST AGENT</p><h2>让第一个业务场景，<br>在 Raccoon X 上跑起来。</h2><p>从你的团队和业务任务出发，了解合适的应用方式与落地方案。</p><div class="btn-row center"><a class="btn btn-red btn-lg" href="/contact?from=raccoon-x">预约产品演示 ${ICON_ARROW}</a><a class="btn btn-outline btn-lg" href="/partners#apply">申请加入生态渠道</a></div></div></div></section>`;
  return page({ title: 'Raccoon X 智能体平台｜专业助手、专家协作与业务流程', description: R.description, active: 'solutions', head: `<link rel="stylesheet" href="${asset('/css/salesbuddy.css')}"><link rel="stylesheet" href="${asset('/css/raccoon-x.css')}">`, scripts: `<script src="${asset('/js/salesbuddy.js')}" defer></script>`, body: `<div class="sb-page rx-page">${hero}${nav}${intro}${capabilities}${resources}${scenarios}${connect}${faq}${related}${cta}</div>` });
}
module.exports = { raccoonX };
