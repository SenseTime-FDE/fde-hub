'use strict';
/**
 * allfde.com 文案层 v1.2（改文案只动这里）。
 *   v1.2 网站结构（用户 2026-10-06）：
 *     · 品牌英文小字去掉「FDE INSIDE」；
 *     · 「产品与方案」按商汤 AI 全栈方案目录组织，导航下拉菜单，每项单独跳转产品介绍页（CATALOG ＋ PRODUCTS）；
 *     · 「Token Plan」换成「云端 MaaS」入口：国内平台、海外平台，以及相应的模型与服务介绍（CLOUD）；
 *     · 其余产品内容（4+N+X、部署形态、落地陪跑等）都归入产品与方案；
 *     · 首页重新设计，整体介绍生态渠道（HERO、ABOUT、MAP 等）。
 *   结构与表述沿用现站 allfde.com（FDE 原厂落地陪跑为内核 · 伙伴杠杆 · Token 结算；三种伙伴身份；技术交流；页脚备案信息）。
 *   产品事实沿用「商汤企业 AI 全栈产品套册 v1.0」2026-10-06 口径：小浣熊企服版 RaccoonBuddy（四款 Buddy ＋ 伙伴 N ＋ X）、
 *     Raccoon X 智能体平台、MaaS 平台（国内 · 海外 · 私有化）、个人 AI 工具，全栈延伸（模型 API、算力租赁）；
 *     v1.2.2：用户要求拿掉万象算力调度平台（目录、产品页与各处提及一并删除）；下拉菜单里小浣熊企服版分两列（应用 / 平台，CATALOG 的 lane）。
 *     v1.3：先拿掉 HR 小浣熊、客服小浣熊与个人 AI 工具（SoWork、Raccoon Work）；AI 应用是主菜单（4+N+X），下设一级菜单「商汤小浣熊 · 4」
 *       与「伙伴 ISV · N＋X（分行业与场景）」；按用户提供的套册截图补充六个断点、整体功能、方案亮点与价值、N ＋ X、整体架构、
 *       一条业务线、核心商业模式与伙伴 ISV 加入（文字取套册现行版本，不写状态、海外上线日期与万象）。
 *     云端 MaaS 取自分册 1.3。不标注状态；Action 等英文词首字母大写；个人 AI 工具 SaaS 免费、私有化收费；
 *     不写海外上线日期、价格、客户与伙伴名、底座来源平台，不列模型名称与型号。
 *   与现站不一致处按套册口径处理，见 docs/口径与来源说明.md 第 2 节。
 */

const SITE = {
  name: '商汤生态渠道',
  domain: 'allfde.com',
  sign: '商汤科技 · 大模型生态渠道部',
  signEn: 'SenseTime · Ecosystem Partnerships',
  brandEn: 'AI ECOSYSTEM PARTNERSHIPS',
  slogan: '企业真正的AI伙伴，业务场景即刻落地',
  description: '商汤生态渠道：以商汤 AI 全栈产品为供给，以原厂落地陪跑为内核，以伙伴为杠杆，以 Token 统一结算，和伙伴一起把 AI 落到千行百业。',
  nav: [
    { href: '/solutions', label: '产品与方案', key: 'solutions', menu: 'solutions' },
    { href: '/cloud-maas', label: '云端 MaaS', key: 'cloud', menu: 'cloud' },
    { href: '/events', label: '市场活动', key: 'events' },
    { href: '/careers', label: '人才招聘', key: 'careers' },
    { href: '/community', label: '技术交流', key: 'community' },
    { href: '/partners', label: '加入生态', key: 'partners' },
  ],
  footer: {
    icp: '沪 ICP 备 19044592 号-3',
    police: '沪公网安备 31010402009327 号',
    copyright: '© 2014-2026 SenseTime. All Rights Reserved.',
    company: '上海商汤智能科技有限公司',
    note: '上海商汤智能科技有限公司是商汤集团旗下子公司',
  },
};

/* ---------- 首页：整体介绍生态渠道 ---------- */
const HERO = {
  kicker: 'SENSETIME · AI ECOSYSTEM PARTNERSHIPS',
  line1: '把 FDE 级的 AI 落地能力',
  line2: '复制给每一家伙伴',
  sub: '商汤生态渠道以商汤 AI 全栈产品为供给，以原厂落地陪跑（FDE）为内核，以伙伴为杠杆，以 Token 统一结算 —— 和伙伴一起，把 AI 落到千行百业。',
  ctas: [
    { href: '/partners#apply', label: '申请加入生态渠道', primary: true },
    { href: '/solutions', label: '了解产品与方案' },
  ],
  tags: ['AI 全栈产品', '原厂落地陪跑', '伙伴杠杆', 'Token 统一结算'],
};

const ABOUT = {
  title: '一套产品，一个内核，<em>一个杠杆，一种结算</em>',
  lead: '生态渠道是商汤大模型产品走向千行百业的通路：商汤提供 AI 全栈产品与原厂落地陪跑，伙伴带着产品与方案服务客户，客户按用量付费，商业化统一收敛为 Token。',
  pillars: [
    { tag: '供给', title: 'AI 全栈产品', href: '/solutions', text: '小浣熊企服版（4+N+X 应用、Raccoon X、MaaS 平台）与全栈延伸（模型 API、算力租赁），伙伴拿来即卖。' },
    { tag: '内核', title: '原厂落地陪跑', href: '/solutions/services', text: 'FDE 深入客户业务一线，把需求翻译成可演示的 Agent 场景，陪跑试点与上线，每个方案都有真实交付打底。' },
    { tag: '杠杆', title: '伙伴复制放大', href: '/partners', text: '渠道伙伴、生态伙伴（ISV）与服务伙伴，把打样成功的方案复制到更多客户与行业。' },
    { tag: '收口', title: 'Token 统一结算', href: '/cloud-maas', text: '软件与服务免费，客户为效果买单：Token Plan 订阅或 Token API 按量，国内、海外两个云端平台。' },
  ],
  stats: [
    { num: '4+N+X', label: '供给', text: '商汤小浣熊 ＋ N 个行业方案 ＋ X 个场景 Agent' },
    { num: '20+', label: 'Agent 搭建能力', text: '真实项目打样，可演示' },
    { num: '3', label: '种伙伴身份', text: '可单选，可多选' },
    { num: '2', label: '个云端平台', text: '国内 · 海外，开通即用' },
  ],
};

/** 生态全景：商汤提供什么 → 伙伴做什么 → 客户得到什么 */
const MAP = {
  title: '商汤、伙伴、客户，<em>各做最擅长的事</em>',
  lead: '商汤把产品、平台与落地方法准备好；伙伴贴近客户，做销售、行业方案与交付；客户开箱即用，按用量付费。',
  cols: [
    { en: 'SENSETIME', title: '商汤提供', items: [
      { b: 'AI 全栈产品与平台', t: '小浣熊企服版、Raccoon X、MaaS 平台与全栈延伸' },
      { b: '原厂落地陪跑', t: '需求翻译、Demo 验证、试点落地，方案资产统一沉淀' },
      { b: 'Token', t: 'Token Plan 订阅或 Token API，一种货币、一个账户' },
      { b: '品牌、活动与线索', t: '市场活动与内容传播，线索按归属规则分发' },
    ] },
    { en: 'PARTNERS', title: '伙伴去做', items: [
      { b: '渠道伙伴 · 有客户', t: '经营客户，转售 Token Plan，客户直签归伙伴' },
      { b: '生态伙伴（ISV）· 有产品', t: '基于 Raccoon X 做 N 个行业方案与 X 个 Agent' },
      { b: '服务伙伴 · 有团队', t: '以原厂方法论做落地陪跑与客户成功' },
    ] },
    { en: 'CUSTOMERS', title: '客户得到', items: [
      { b: '开箱即用的 AI 应用', t: '商汤小浣熊与伙伴的行业方案、场景 Agent' },
      { b: '按需部署', t: '私有化、云端 SaaS 多租户或混合' },
      { b: '按用量付费', t: '软件与服务免费，为跑通的效果买单' },
      { b: '落地有人陪跑', t: '指标与基线共同确认，过程可追溯' },
    ] },
  ],
  band: { label: '商业模式', text: '<em>加油送车</em>：车是应用，油是 Token —— 送车降低门槛，加油持续经营。', href: '/partners#model', more: '看核心商业模式' },
};

const METHOD = {
  title: 'FDE 打样一次，伙伴复制一百次',
  lead: '每一个对外售卖的方案，背后都有真实交付打底；伙伴带着方案对客，新的场景又回到方案库。',
  steps: [
    { title: 'FDE 一线打样', text: '在真实客户项目里跑通场景：需求翻译、Demo 验证、试点落地。' },
    { title: '沉淀方案资产', text: '跑通的场景沉淀为标准方案、可演示的 Demo、模板与 SOP。' },
    { title: '伙伴带着方案对客', text: '伙伴无需从零开始，商汤原厂陪跑关键项目，帮伙伴把单落住。' },
    { title: '场景与消耗回流', text: '新项目沉淀新场景，方案库越滚越大，客户的 Token 消耗持续增长。' },
  ],
};

const GROW = [
  { en: 'EVENTS', title: '市场活动', href: '/events', text: '大会主题演讲、高管闭门研修、企业内训工作坊与系列陪跑训练营，把商汤 AI 带到每一个活动现场。' },
  { en: 'COMMUNITY', title: '技术交流', href: '/community', text: 'Agent 搭建、模型与 Token Plan、知识库与落地方法 —— 技术交流社群向伙伴与开发者开放。' },
  { en: 'CAREERS', title: '人才招聘', href: '/careers', text: 'FDE 交付工程师、生态招商、市场运营、私域运营 —— 和生态一起长大。' },
];

const CTA = {
  title: '把 FDE 的能力，变成你的生意',
  text: '告诉我们你有客户、有产品还是有团队 —— 生态渠道帮你选好第一条路，首单原厂陪跑。提交申请后，顾问将通过企业微信与你对接，并邀请你进入生态渠道伙伴社群。',
  cta: { href: '/partners#apply', label: '申请加入生态渠道' },
};

/* ---------- 产品与方案：商汤 AI 全栈方案目录（导航下拉菜单与总览页共用） ---------- */
const CATALOG = [
  { key: 'rb', title: '小浣熊企服版', en: 'RaccoonBuddy', note: '整套可私有化 · 云端 SaaS 多租户 · 模块可单独采购', href: '/solutions/raccoonbuddy', items: [
    // lane 1：AI 应用是主菜单（4+N+X）；当前官网只展示已提供完整页面的两款商汤小浣熊，未确认产品不补写。
    { slug: 'apps', lane: 1, name: 'AI 应用 · 4+N+X', text: '商汤小浣熊 ＋ 伙伴 ISV 的行业方案与场景 Agent', subs: [
      { label: '商汤小浣熊 · 当前展示', items: [
        { slug: 'salesbuddy', name: 'SalesBuddy 销售小浣熊', text: '过程留痕、经营判断、行动建议' },
        { slug: 'projectbuddy', name: 'ProjectBuddy 项目小浣熊', text: '目标导向的项目过程管理' },
      ] },
      { label: '伙伴 ISV · N＋X', note: '分行业与场景', slug: 'partner-isv', items: [
        { slug: 'partner-isv', anchor: 'industry', name: 'N · 行业方案', text: '伙伴 ISV 按行业提供的方案' },
        { slug: 'partner-isv', anchor: 'scenario', name: 'X · 场景 Agent', text: '伙伴 ISV 按场景搭建的 Agent' },
      ] },
    ] },
    { slug: 'raccoon-x', lane: 2, name: 'Raccoon X 智能体平台', text: '专家智能体团队 ＋ 岗位 AI 助理' },
    { slug: 'maas', lane: 2, name: 'MaaS 平台', text: 'API 网关与 Token Plan 账户体系，可私有化' },
  ] },
  { key: 'ext', title: '全栈延伸', en: 'FULL STACK', note: '不在企服版内，可组合采购', items: [
    { slug: 'model-api', name: '模型 API', text: 'SenseNova 日日新，自研和开源大模型' },
    { slug: 'compute-rental', name: '算力租赁', text: '按需租用商汤算力，补充已有算力' },
  ] },
  { key: 'svc', title: '部署与服务', en: 'SERVICES', note: '私有化 · 云端 · 混合', items: [
    { slug: 'services', name: '部署与落地陪跑', text: '三种部署形态，原厂落地陪跑，定制开发' },
  ] },
];

const SOLUTIONS = {
  title1: '商汤 AI 全栈方案',
  title2: '小浣熊企服版 ＋ 全栈延伸',
  lead: '小浣熊企服版（AI 应用 4+N+X、Raccoon X 智能体平台、MaaS 平台）整套可私有化，也提供云端 SaaS 多租户；模型 API 与算力租赁作为全栈延伸，可组合采购。',
  catalogLead: '先看目录，再进单个产品：每款产品一页，讲清解决什么问题、产品逻辑与带来的价值。',
  // 整体架构（套册总册一「整体架构：企服版三层 ＋ 全栈延伸」现行版本；格子为 [名称, 小字]；frame 为小浣熊企服版三层）
  arch: [
    { label: '协同与入口', cells: [['飞书 · 钉钉 · 企业微信'], ['微信小程序'], ['PC 工作台'], ['X 工作台'], ['业务系统 · API']] },
    { label: 'AI 应用 · 4+N+X', href: '/solutions/apps', tone: 'red', frame: true, cells: [['销售小浣熊', 'SalesBuddy'], ['项目小浣熊', 'ProjectBuddy'], ['伙伴 ISV', 'N 行业 ＋ X 场景']] },
    { label: 'Raccoon X 智能体平台', href: '/solutions/raccoon-x', tone: 'violet', frame: true, cells: [['专家智能体', 'AI Native'], ['岗位 AI 助理', '每人一位'], ['团队协作', '目标任务项目'], ['Memory', '统一三层'], ['RAG 知识库', '多模态'], ['管控审计', 'Prompt · Skill']] },
    { label: 'MaaS 平台', href: '/solutions/maas', tone: 'blue', frame: true, cells: [['API 网关', '统一接入 · 计量'], ['Token Plan', '订阅权益'], ['国内', 'token.sensetime.com'], ['海外', '海外版 MaaS 平台']] },
    { label: '模型 · 全栈延伸', href: '/solutions/model-api', tone: 'slate', cells: [['SenseNova 日日新', 'LLM 与多模态'], ['开源大模型'], ['第三方聚合大模型', '含闭源']] },
    { label: '算力 · 全栈延伸', href: '/solutions/compute-rental', tone: 'slate', cells: [['客户已有算力', '英伟达 · 国产卡'], ['算力租赁', '按需租用商汤算力']] },
  ],
  archBand: '小浣熊企服版整套可私有化 · 云端 SaaS 多租户 · 商汤原厂落地陪跑',
  base: ['一套 RAG 知识库', '一套 Memory', '统一身份与权限', '全链路审计', 'Token Plan 计量', '商汤原厂落地陪跑'],
  // 业务逻辑：事情怎么流转（架构页右侧四步；第 4 步不写万象）
  logic: [
    { title: '业务与待办进来', text: 'xBuddies 的业务和飞书、钉钉的待办，一次录入，谁主责谁是主数据。' },
    { title: 'Agent 团队承接', text: '专家智能体与岗位助理读同一套知识库与 Memory，出草稿，真人确认。' },
    { title: '模型统一接入与计量', text: '调用经 API 网关路由到 SenseNova、开源或第三方模型，按 Token Plan 计量。' },
    { title: '算力按需补充', text: '私有化部署利用客户已有算力；不足时租赁商汤算力，或接入云端 MaaS。' },
  ],
  // 一条业务线，怎样贯通各层（套册「业务闭环」页；流程示意，不是客户案例）
  loopLead: '以「一个商机从拜访到交付」为例（流程示意）：数据一次录入、全程复用，经验回流后下一轮更准。',
  loop: [
    { who: 'SalesBuddy', title: '拜访留痕', points: ['语音或文件录入沟通过程', 'AI 整理并关联客户与商机', '缺失项保留「待确认」'], out: '客户 · 商机 · 跟进记录' },
    { who: 'SalesBuddy', title: '判断与推进', points: ['专家智能体识别商机卡点', '建议写到动作层面', '业务人员作最终判断'], out: '下一步行动与任务' },
    { who: 'ProjectBuddy', title: '售前与立项', points: ['销售发起售前任务', 'ProjectBuddy 承接，记录工时', '确认后回写跟进记录'], out: '售前记录 · 立项卡' },
    { who: 'ProjectBuddy', title: '交付与验收', points: ['六个关口逐关签字', '任务卡与验收证据留痕', '沉淀可复用的标准件'], out: '验收证据 · 标准件' },
    { who: 'Raccoon X', title: '复盘与回流', points: ['周报自动汇聚，反馈留痕', '经验与标准件进知识库', '下一次拜访与交付直接调用'], out: '知识与记忆更新' },
  ],
  loopBands: [
    { label: '全程底座', text: '每一步的模型调用经 <em>API 网关</em> 路由到 <em>SenseNova</em> 或第三方模型，按 <em>Token Plan</em> 计量到人。' },
    { label: '一句话', text: '<em>数据一次录入，全链路复用</em>：销售的记录是交付的输入，交付的结果是下一次销售的依据。' },
  ],
  deploy: [
    { title: '私有化部署', text: '小浣熊企服版整套部署在客户本地，可利用客户已有算力。', fit: '数据边界明确的金融、政企、国央企' },
    { title: '云端 SaaS 多租户', text: '开通即用，按智能体与 Token / Token Plan 使用；国内、海外两个平台。', fit: '希望轻量起步、快速验证的企业' },
    { title: '混合部署', text: '本地 ＋ 云端：本地算力不足的部分，租赁商汤算力或用云端。', fit: '已有算力的企业、集团型企业' },
  ],
};

/* ---------- 云端 MaaS（分册 1.3 口径） ---------- */
const CLOUD = {
  title1: '云端 MaaS 平台',
  title2: '国内 · 海外，开通即用',
  lead: '智能体（Raccoon X 编排）＋ Token Plan ＋ 模型 API，全套提供；面向企业客户的云端 SaaS 多租户。国内、海外两个平台的定价、套餐、模型及支付结算各自独立。',
  link: { href: 'https://token.sensetime.com', label: '前往国内平台 token.sensetime.com' },
  platforms: [
    { id: 'cn', en: 'CHINA', title: '国内平台', sub: 'token.sensetime.com', text: '面向国内企业客户的云端 MaaS 平台：注册开通即用，支持线上支付，也支持线下合同与支付。',
      rows: [['面向', '国内企业客户'], ['形态', '云端 SaaS 多租户'], ['全套能力', '智能体（Raccoon X 编排）＋ Token Plan ＋ 模型 API'], ['模型与套餐', '国内模型清单、套餐与定价'], ['支付', '线上支付（订阅套餐或充值余额）＋ 线下合同与支付']],
      cta: { href: 'https://token.sensetime.com', label: '前往国内平台', out: true } },
    { id: 'os', en: 'OVERSEAS', title: '海外平台', sub: '海外版 MaaS 平台', text: '面向海外企业客户的云端 MaaS 平台：部署在海外云，整合 Raccoon X 智能体编排，以线下合同与支付为主。',
      rows: [['面向', '海外企业客户'], ['形态', '云端 SaaS 多租户，部署在海外云'], ['全套能力', '智能体（Raccoon X 编排）＋ Token Plan ＋ 模型 API'], ['模型与套餐', '海外模型清单、套餐与定价，与国内各自独立'], ['支付', '以线下合同与支付为主']],
      cta: { href: '/contact?from=cloud-overseas', label: '咨询海外平台' } },
  ],
  choose: [
    { cap: '国内业务', title: '用国内平台', text: 'token.sensetime.com，开通即用。' },
    { cap: '海外业务', title: '用海外平台', text: '海外套餐与模型，线下签约开通。' },
    { cap: '数据不出企业', title: '用国内私有化版', text: '随小浣熊企服版部署在客户本地。', href: '/solutions/maas' },
  ],
  services: [
    { en: 'AGENTS', title: '智能体', sub: 'Raccoon X 编排', points: ['专家智能体与多 Agent 编排', '多模态 RAG 知识库与统一 Memory', '开发并发布企业 AI 应用'] },
    { en: 'TOKEN PLAN', title: 'Token Plan', sub: '按人订阅 · 三层额度', points: ['按人按月订阅的模型使用权益', '一份积分跨模型、跨模态通用', '用量计量到人与应用'] },
    { en: 'MODEL API', title: '模型 API', sub: '一个 Key · 按量计费', points: ['API 网关统一接入，兼容主流接口协议', '同步、流式与异步任务', '换模型只改模型名'] },
  ],
  flow: [
    { title: '开通企业账户', text: '在国内或海外平台开通，订阅套餐、充值或签约。' },
    { title: '智能体编排', text: 'Raccoon X 编排智能体与应用，模型调用经 API 网关。' },
    { title: '网关路由到模型', text: '鉴权、限流后路由到商汤自研、开源或第三方模型。' },
    { title: 'Token Plan 记账', text: '用量计到人与应用，按权益扣减，出账单。' },
  ],
  models: [
    { title: '商汤自研和开源大模型', rows: [['定位', 'SenseNova 日日新与开源大模型，LLM 与多模态'], ['用法', '与第三方模型同一个接口、同一种计量单位']] },
    { title: '第三方聚合大模型 · 含闭源', rows: [['范围', '主流厂商的文本、检索、语音、视觉模型'], ['清单', '国内平台与海外平台的模型清单各自独立']] },
  ],
  modelTypes: ['文本生成与图文理解', '向量与重排序', '语音识别', '语音合成', '图片生成', '视频生成'],
  modelNote: '具体可用模型在平台控制台的「模型」页查看；国内与海外各自一份清单。',
  tokenPlan: [
    { cap: '是什么', title: '按人按月订阅的模型使用权益', text: '一份订阅获得共享积分，跨模型、跨模态通用。' },
    { cap: '在哪里用', title: 'API 与编程工具', text: '一个席位，一组模型，跨模型、跨模态通用。' },
    { cap: '怎么选档', title: '多档订阅，按使用强度选', text: '档位越高，额度越多、并发越高；国内与海外套餐各自独立。' },
  ],
  tpTable: { head: ['对比', 'Token Plan 订阅', 'API 按量'], rows: [
    ['怎么付', '按人按月订阅，多档可选', '充值余额，按实际调用量扣费'],
    ['怎么计量', '积分：跨模型、跨模态共享', '各模型按计价维度计费'],
    ['上限', '5 小时 · 每周 · 月度三层额度', '余额内按量调用，受接口限频'],
    ['适合', '人：高频、稳定的日常使用', '系统：业务集成、批量与波动任务'],
  ] },
  tpLine: '<em>人用订阅，系统用按量</em>：订阅让个人成本可预期，按量让系统成本随业务走，一个账户里并存。',
  start: [
    { title: '注册账号', text: 'token.sensetime.com，企业按需认证。' },
    { title: '选方案', text: '订阅套餐或充值余额，企业也可线下签约。' },
    { title: '建组织', text: '添加成员与项目，设置管理员。' },
    { title: '建 Key 与使用', text: '按应用创建 API Key，用于 API 与编程工具。' },
    { title: '看用量与账单', text: '用量、日志与账单一处看，续订、增购或充值。' },
  ],
  console: ['模型', 'API 密钥', '用量', '调用日志', 'Token 套餐', '费用中心', '服务状态', '账号管理'],
  pay: [
    { title: '线上支付 · 控制台自助', rows: [['订阅套餐', '在控制台订阅 Token Plan，按人按月'], ['充值余额', 'API 按实际调用量从余额扣费'], ['查账单', '费用中心查看订阅、充值与账单']] },
    { title: '线下合同与支付 · 企业采购', rows: [['签约', '企业与商汤签订合同，约定采购内容与期限'], ['付款', '按合同约定对公付款'], ['开通与对账', '签约后开通组织账户，按合同对账']] },
  ],
  payNote: '国内平台线上支付与线下合同并行；海外平台以线下合同与支付为主。两种方式开通的是同一个平台、同一套计量与账单。',
  accounts: [
    { title: '集团', text: '统一采购，建组织树，向下级下发，看全集团用量。' },
    { title: '分子公司', text: '承接集团权益，开通部门，划拨与代开通。' },
    { title: '部门', text: '席位绑定到人，应用建 Key，按成员查询用量。' },
    { title: '个人', text: '一个席位与套餐额度，登录即用，额度一目了然。' },
  ],
  partners: [
    { tag: '渠道伙伴', text: '转售商汤 Token Plan，经营订阅、续费与升档；客户直签归伙伴。' },
    { tag: '生态伙伴（ISV）', text: '自有 Agent 产品调用商汤 Token，用量以 Token Plan 结算。' },
    { tag: '服务伙伴', text: '服务以 Token Plan 计价收费，一次性人天变为可续费订阅。' },
  ],
};

/* ---------- 加入生态 ---------- */
const PARTNER = {
  title1: '三种伙伴身份',
  title2: '可单选，可多选',
  lead: '有客户的做渠道伙伴，有 Agent 产品的做生态伙伴，有交付团队的做服务伙伴 —— 身份可叠加，首单由商汤 FDE 原厂陪跑。',
  typesLead: '有客户的做渠道伙伴，有 Agent 产品的做生态伙伴，有交付团队的做服务伙伴 —— 身份可自由叠加，叠加越多，合作越深，政策越优。',
  types: [
    { key: 'channel', en: 'CHANNEL PARTNER', title: 'FDE 渠道伙伴', have: '有客户', text: '转售商汤 Token Plan，经营订阅、续费与升档。',
      points: ['客户直签归伙伴：合同你签、发票你开、续费也是你的', '报备保护：客户归属伙伴，商汤不争客户', '伙伴折扣拿货、市场价对客，收益清清楚楚'] },
    { key: 'isv', en: 'ISV PARTNER', title: 'FDE 生态伙伴（ISV）', have: '有产品', text: '自有 Agent 产品接入商汤模型，联合打造行业解决方案。',
      points: ['产品调用商汤 Token，用量以 Token Plan 结算', '联合方案进入生态渠道方案库，全渠道传播', '线索共享：生态渠道线索按归属规则分发'] },
    { key: 'service', en: 'SERVICE PARTNER', title: 'FDE 服务伙伴', have: '有团队', text: '以商汤 FDE 方法论对客做 AI 落地陪跑与客户成功。',
      points: ['服务以 Token Plan 计价收费，一次性人天变可续费订阅', '商汤输出方法论、培训与全套场景 Demo 资产', 'FDE 联盟按行业吸纳，共享品牌、内容与线索'] },
  ],
  line: '不管你手里有客户、有产品还是有团队，生态渠道都有一条能马上开工的路。',
  model: {
    title: '生态渠道的核心商业模式：<em>4+N+X ＋ 加油送车</em>',
    car: [
      { tag: '4', text: '商汤小浣熊：SalesBuddy、ProjectBuddy 等' },
      { tag: 'N · 行业', text: '伙伴 ISV 提供 N 个行业的方案' },
      { tag: 'X · Agent', text: '伙伴 ISV 提供 X 个 Agent' },
      { tag: '共用底座', text: 'Raccoon X ＋ MaaS 平台' },
    ],
    fuel: [
      { tag: '送车', text: '4+N+X 应用随服务提供，不单独收软件费' },
      { tag: '加油', text: 'Token Plan 或 Token API，按用量付费' },
      { tag: '教开车', text: '商汤原厂落地陪跑：配置、培训、运营' },
      { tag: '改装', text: '按需定制开发，单独收费' },
    ],
    roles: { head: ['角色', '做什么', '得到什么'], rows: [
      ['商汤', '供油：Token Plan 与 Token API；平台：Raccoon X 与 MaaS；原厂兜底', '持续的 Token 用量'],
      ['伙伴 ISV', '供车：行业方案与 Agent，共创打样、上架货架', 'Token、平台与带教，按合作协议获得收益'],
      ['渠道伙伴', '提货、签约客户、本地交付', '按合作协议获得收益'],
      ['客户', '一份合同、一种货币，按用量加油', '应用开箱即用，用量可度量，数据与终审权在自己手里'],
    ] },
    line: '车是应用，油是 Token：<em>送车降低门槛，加油持续经营</em>；教开车是原厂陪跑，改装是定制开发。',
  },
  isv: {
    title: '伙伴 ISV 加入商汤生态：<em>拿 Token，也拿方法</em>',
    values: [
      { cap: '核心价值 ①', title: '从商汤获取 Token', points: ['Token Plan 或 Token API 两种形态', '一种货币、一个账户，MaaS 统一计量'] },
      { cap: '核心价值 ②', title: 'AI 产品带教', points: ['SalesBuddy 带销售管理', 'ProjectBuddy 带落地交付（FDE）'] },
      { cap: '核心价值 ③', title: '平台与货架', points: ['基于 Raccoon X 开发，不自建底座', '上架小浣熊企服版，统一品牌'] },
    ],
    steps: [
      { who: '伙伴', title: '签约加入', points: ['签署合作协议', '成为商汤生态 ISV'] },
      { who: '伙伴 × 商汤', title: '获取 Token', points: ['Plan 或 API 两种形态', '用量统一计量'] },
      { who: '伙伴 × 商汤', title: '共创打样', points: ['在 Raccoon X 上开发', '行业方案与 Agent'] },
      { who: '伙伴 × 商汤', title: '上架货架', points: ['上架小浣熊企服版', '统一品牌、统一入口'] },
      { who: '伙伴', title: 'AI 带教', points: ['SalesBuddy 带销售', 'ProjectBuddy 带交付'] },
      { who: '客户 × 伙伴', title: '加油与结算', points: ['客户按用量加油', '按合作协议结算'] },
    ],
    band: '伙伴 ISV 从商汤拿到 <em>Token</em>，也拿到 <em>销售管理与落地交付的整套方法</em>：SalesBuddy 与 ProjectBuddy 带教，AI 工具赋能伙伴团队。',
  },
  stepsTitle: '四步，从申请到规模复制',
  stepsLead: '首单由商汤 FDE 原厂陪跑 —— 先把第一单落住，再谈规模复制。',
  steps: [
    { title: '提交申请', text: '告诉我们你有客户、有产品还是有团队 —— 一张表即可发起，生态渠道团队会尽快与你联系。' },
    { title: '对齐身份与场景', text: '选择渠道伙伴、生态伙伴（ISV）、服务伙伴中的一种或多种身份，对齐首批目标场景与客户盘。' },
    { title: '首单原厂陪跑', text: '商汤 FDE 陪跑第一单：需求翻译、Demo 验证、试点落地，把第一单落住。' },
    { title: '规模复制', text: '带着方案库与 Demo 复制到更多客户；新场景回流方案库，Token 消耗持续增长。' },
  ],
  identity: {
    title: '体验身份：你手里有什么？',
    lead: '选一个或多个，看看哪种伙伴身份适合你。',
    options: [
      { key: 'channel', label: '我有客户', hint: '手里有企业客户与销售渠道' },
      { key: 'isv', label: '我有产品', hint: '有自研的 Agent 或行业应用' },
      { key: 'service', label: '我有团队', hint: '有实施、交付或运营团队' },
    ],
  },
  typeOptions: ['FDE 渠道伙伴', 'FDE 生态伙伴（ISV）', 'FDE 服务伙伴'],
  haveOptions: ['有客户', '有产品', '有团队'],
  sizeOptions: ['20 人以下', '20–99 人', '100–499 人', '500 人以上'],
};

/* ---------- 市场活动 ---------- */
const EVENTS = {
  kicker: 'SENSETIME · AI ENABLEMENT',
  title1: '把商汤 AI，',
  title2: '带到每一个活动现场。',
  tags: ['行业趋势', '实践案例', '招商交流', '伙伴共建'],
  highlightsLead: '从行业论坛、企业参访到伙伴共创，带你看看我们正在发生的 AI 交流现场。',
  types: [
    { en: 'KEYNOTE', title: '大会主题演讲', sub: '关注 AI 趋势与行业实践', text: '面向行业与企业决策者，讲清 AI 趋势、真实案例与落地路径。' },
    { en: 'CLOSED-DOOR', title: '高管闭门研修', sub: '面对面交流，深入真实问题', text: '小范围、深交流：带着业务问题来，和商汤与同行一起拆解。' },
    { en: 'WORKSHOP', title: '企业内训工作坊', sub: '围绕企业场景动手实践', text: '针对一家企业的场景定制内容，现场搭建 Agent、跑通流程。' },
    { en: 'BOOTCAMP', title: '系列陪跑训练营', sub: '连续多期，从学到用', text: '分期陪跑，从认知、方法到上手实践，把 AI 用进日常工作。' },
  ],
  onsite: ['主题分享', '案例拆解', '产品体验', '同行交流'],
  onsiteTitle: '从听见观点，到看见实践',
  onsiteText: '不只听一场分享，还能看到真实案例、体验产品能力、与同行交流落地经验。',
  gains: [
    { en: 'INSIGHT', title: '看懂趋势', text: '了解 AI 在行业与企业中的最新进展，判断下一步该投入哪里。' },
    { en: 'METHOD', title: '学到方法', text: '从真实案例中学习从需求诊断到试点验收的落地方法。' },
    { en: 'NETWORK', title: '认识同行', text: '与同样在推进 AI 落地的企业与伙伴交流，找到合作机会。' },
  ],
  learn: [
    { title: 'AI 趋势与战略', text: '大模型与智能体的发展方向，企业如何制定 AI 战略。' },
    { title: '管理者的 AI 转型', text: '管理者如何带团队用 AI，组织与流程怎样随之调整。' },
    { title: 'AI4SE 软件工程', text: 'AI 进入软件研发全流程：需求、编码、测试与交付。' },
    { title: '行业落地案例', text: '来自一线项目的场景拆解：做了什么、怎么做、效果怎样验证。' },
    { title: 'Token Plan 与生态', text: '用 Token Plan 统一结算，伙伴如何加入并经营客户。' },
    { title: 'AI 落地方法论', text: '从 Demo 到试点再到规模推广，FDE 落地方法的关键环节。' },
  ],
  regSteps: [
    { title: '填写姓名与手机号', text: '方便我们发送参会信息与提醒。' },
    { title: '填写公司、职位与邮箱', text: '帮助我们安排适合你的议程与交流。' },
    { title: '同意隐私说明并提交', text: '提交后即完成报名，参会信息会发送给你。' },
  ],
  finalTitle: '下一场活动，期待与你现场见面',
};
const EVENT_KINDS = ['大会主题演讲', '高管闭门研修', '企业内训工作坊', '系列陪跑训练营', '招商大会', '行业沙龙', '线上直播'];

/* ---------- 人才招聘 ---------- */
const CAREERS = {
  kicker: 'CAREERS · 人才招聘',
  title1: '加入商汤 FDE',
  title2: '把 AI 装进真实业务',
  lead: '我们深入客户业务一线，把模型、Agent、语音和知识连接成可运行的 AI 系统；再把项目经验沉淀为伙伴能够复制的产品与方法。',
  tags: ['客户现场', '业务系统', '伙伴复制'],
  teamTitle: '不止做 Demo，真正把系统落到业务里',
  teamText: '商汤生态渠道团队选择平台落地型 FDE：从客户的真实问题出发，贯穿需求诊断、方案设计、系统搭建、上线陪跑与效果复盘。',
  teamQuote: 'FDE 在这里不只是一个岗位名称，而是连接客户、产品和伙伴的工作方式：先把代表性场景跑通，再把方法沉淀为可复用资产。',
  teamPoints: [
    { title: '深入业务一线', text: '理解客户的流程、数据、权限与系统边界，把模糊需求转成首个值得验证的 AI 场景。' },
    { title: '对落地结果负责', text: '不止展示功能，而是围绕可运行、可验收、可持续运营推动系统进入真实业务。' },
    { title: '沉淀资产，带动伙伴复制', text: '把项目经验变成组件、模板、评测与行业方法，为后续伙伴协同交付提供基础。' },
  ],
  roleTitle: '从商机到交付，再到持续增长',
  roleLead: '几个方向围绕同一条业务链协作：理解客户问题，推进方案与 Demo，完成系统交付，再把内容、社群和伙伴经营沉淀为持续增长。',
  roles: [
    { key: 'fde', title: 'FDE 交付工程师', text: '深入客户现场：需求诊断、方案设计、系统搭建、上线陪跑与效果复盘。', keyword: 'FDE' },
    { key: 'bd', title: '生态招商', text: '拓展渠道、生态与服务伙伴，推动伙伴方案上架与联合经营。', keyword: '招商' },
    { key: 'mkt', title: '市场运营', text: '策划市场活动与内容，让行业趋势与落地案例被更多企业看到。', keyword: '市场' },
    { key: 'private', title: '私域运营', text: '经营伙伴与客户社群，承接线索，持续传递产品与方法。', keyword: '私域' },
  ],
  quiz: {
    title: '体验简历选择：你更想做哪件事？',
    options: [
      { key: 'fde', label: '在客户现场把系统搭起来' },
      { key: 'bd', label: '找伙伴、谈合作、推方案' },
      { key: 'mkt', label: '策划活动，把内容讲给更多人听' },
      { key: 'private', label: '经营社群，把关系和线索养起来' },
    ],
  },
  kinds: ['社会招聘', '校园招聘'],
  yearsOptions: ['应届', '1–3 年', '3–5 年', '5–10 年', '10 年以上'],
};

/* ---------- 技术交流 ---------- */
const COMMUNITY = {
  kicker: 'COMMUNITY · 技术交流',
  title1: '和伙伴一起，',
  title2: '把 Agent 真正搭起来',
  lead: '伙伴交流、Agent 搭建、模型与 Token Plan、知识库与落地方法 —— 技术交流社群向生态伙伴与开发者开放加入。',
  topics: [
    { title: 'Agent 搭建', text: '在 Raccoon X 上搭建专家智能体与岗位助理，Prompt 与 Skill 自己配。' },
    { title: '模型与 Token Plan', text: '一个 Key 调用多款模型，用量统一计量，成本算得清。' },
    { title: 'RAG 知识库与 Memory', text: '多模态知识入库、检索带出处，记忆随岗位走、人走资产留。' },
    { title: '落地方法论', text: '从需求诊断到试点验收，FDE 方法沉淀为可复用的资产。' },
    { title: '伙伴经验', text: '伙伴之间交流行业方案、交付经验与经营心得。' },
    { title: '沙龙与直播', text: '技术沙龙与线上直播，第一时间获取活动通知。' },
  ],
  steps: [
    { title: '提交申请', text: '留下联系方式与关心的话题' },
    { title: '顾问对接', text: '顾问通过企业微信与你联系' },
    { title: '进入社群', text: '邀请你进入生态渠道技术交流群' },
  ],
  topicOptions: ['Agent 搭建', '模型与 Token Plan', 'RAG 知识库与 Memory', '落地方法论', '伙伴经验', '沙龙与直播'],
  roleOptions: ['开发者 / 工程师', '产品经理', '解决方案 / 售前', '伙伴企业负责人', '企业 IT 与数字化', '其他'],
};

/* ---------- 预约演示 ---------- */
const CONTACT = {
  title: '预约演示 · 咨询合作',
  lead: '留下联系方式，生态渠道团队会尽快与您联系，安排产品演示与方案沟通。',
  interests: ['小浣熊企服版整体方案', 'SalesBuddy 销售小浣熊', 'ProjectBuddy 项目小浣熊', 'Raccoon X 智能体平台', 'MaaS 平台（可私有化）', '云端 MaaS（国内 · 海外）', '模型 API · 算力租赁', '获取产品白皮书'],
  industries: ['金融', '政企与国央企', '制造', '零售与消费', '医疗健康', '教育', '互联网与软件', '其他'],
};

/**
 * 产品介绍页（/solutions/:slug），与 CATALOG 一一对应。
 *   字段：group（CATALOG 分组）、name、cn、color、kicker、slogan、position、quote（定位原话，可选）、
 *   problems / logic / values（一页看懂，可选）、sections（cards · steps · table · band）、features、note。
 *   section.title 可含 <em>，其余字段一律转义。
 */
const PRODUCTS = {
  raccoonbuddy: {
    group: 'rb', name: '小浣熊企服版', cn: 'RaccoonBuddy', color: 'red', kicker: 'RACCOONBUDDY',
    slogan: '企业真正的AI伙伴，业务场景即刻落地',
    position: '商汤小浣熊企服版：4+N+X 应用 ＋ Raccoon X 智能体平台 ＋ MaaS 平台，整套可私有化，也提供云端 SaaS 多租户；模块可单独采购，也可整体交付。',
    quote: '真正服务企业的 xBuddies，多场景AI业务伙伴，可横向扩展销售、人力、运营、客服、IT等模块',
    sections: [
      // 套册总册一「企业 AI 落地，卡在六个断点」：每个断点对应的模块可点进产品页
      { type: 'pains', en: 'PAIN POINTS', title: '企业 AI 落地，卡在<em>六个断点</em>', lead: '不缺模型，缺的是把 AI 接进业务、管进组织、算清成本的一整套产品。', items: [
        { no: '01', title: '销售过程看不见', points: ['客户优先级缺少共同依据，商机卡点散落在沟通里', '有效判断依赖少数资深人员，难以复盘'], mods: [{ label: 'SalesBuddy', href: '/solutions/salesbuddy' }] },
        { no: '02', title: '项目管不住', points: ['售前、交付、产品各记各的，串不成一条线', '关口无签字，验收无证据'], mods: [{ label: 'ProjectBuddy', href: '/solutions/projectbuddy' }] },
        { no: '03', title: 'AI 停留在个人工具', points: ['员工各用各的 AI 辅助工具，组织里接不起来', '目标、任务、项目与 Agent 不打通'], mods: [{ label: 'Raccoon X 智能体平台', href: '/solutions/raccoon-x' }] },
        { no: '04', title: '知识与记忆不通，Know-How 未沉淀', points: ['图表、截图、录音里的知识查不到', '每个 Agent 各记各的，人走经验也走', '可配置的 Skill/Prompt，将好的经验沉淀'], mods: [{ label: 'RAG 知识库、Memory 与 Skill/Prompt', href: '/solutions/raccoon-x' }] },
        { no: '05', title: '待办散在各处', points: ['飞书、钉钉和各系统里的待办没人承接', '谁在做、做到哪，要层层追问'], mods: [{ label: 'Raccoon X 工作台', href: '/solutions/raccoon-x' }] },
        { no: '06', title: '模型与成本算不清', points: ['各部门各买各的模型和 Key，账算不清', '想全员用 AI，又怕用量失控'], mods: [{ label: 'MaaS 平台', href: '/solutions/maas' }] },
      ] },
      { type: 'band', label: '小浣熊企服版', text: '六个断点由 <em>4+N+X 应用、Raccoon X 与 MaaS 平台</em> 一起解决；模块可单独采购，也可整体交付。' },
      // 套册「小浣熊企服版整体功能：三部分 · 一套底座」
      { type: 'modules', en: 'OVERALL FUNCTIONS', title: '整体功能：<em>三部分 · 一套底座</em>', cols: [
        { name: 'AI 应用 · 4+N+X', cn: '各种小浣熊', tone: 'red', href: '/solutions/apps', tagline: '商汤小浣熊 ＋ 伙伴 ISV 的行业方案与场景 Agent', groups: [
          { cap: '4 · 商汤小浣熊', items: ['SalesBuddy 销售', 'ProjectBuddy 项目'] },
          { cap: 'N · 行业', items: ['伙伴 ISV 提供 N 个行业方案'] },
          { cap: 'X · 场景', items: ['伙伴 ISV 基于 Raccoon X 提供 Agent'] },
        ] },
        { name: 'Raccoon X', cn: '智能体平台', tone: 'violet', href: '/solutions/raccoon-x', tagline: '专家智能体团队 ＋ 按岗位的个人 AI 助理', groups: [
          { cap: '两种逻辑', items: ['专家智能体团队', '岗位 AI 助理'] },
          { cap: '关键打通', items: ['目标 · 任务 · 项目', '知识库 · Memory'] },
          { cap: '用户端', items: ['X 工作台', '自配 Prompt / Skill'] },
        ] },
        { name: 'MaaS 平台', cn: '国内 · 海外 · 私有化', tone: 'blue', href: '/solutions/maas', tagline: 'Token Plan、API、智能体与应用开发一站式', groups: [
          { cap: '模型接入', items: ['API 网关', 'Token Plan'] },
          { cap: '开发', items: ['智能体开发', '应用开发'] },
          { cap: '云端 SaaS 多租户平台', items: ['国内版 MaaS 平台', '海外版 MaaS 平台'] },
        ] },
      ], base: ['一套 RAG 知识库', '一套 Memory', '统一身份与权限', '全链路审计', 'Token Plan 计量', '原厂落地陪跑'] },
      // 套册「方案亮点与对客价值」（「模块可售」改为采购形态的说法）
      { type: 'value', en: 'HIGHLIGHTS & VALUE', title: '方案亮点与<em>对客价值</em>', highlights: [
        { title: '岗位 Agent 团队', text: '专家智能体服务 AI Native，岗位助理协同工作，现在就能落地。' },
        { title: '目标任务项目打通', text: '目标、任务 Action 与售前、交付、产品的项目管理连成一条线。' },
        { title: '一套知识库与 Memory', text: '多 Agent 之间知识库打通、Memory 打通，人走资产留。' },
        { title: 'Prompt / Skill 自配', text: '用户端自己配置助理，业务人员也能用好 Agent。' },
        { title: 'MaaS 一站式', text: 'Token Plan、API、智能体与应用开发；国内、海外，SaaS 或私有化。' },
        { title: '可整可拆', text: '小浣熊、Raccoon X、MaaS 平台可单独采购，也可整体交付。' },
      ], values: [
        { who: '企业经营者', text: '客户、经验与流程沉淀为企业资产，人走资产留；每个数字可追溯。' },
        { who: '业务负责人', text: '对团队说目标，Agent 团队按组织推进；卡点早暴露，交付有证据。' },
        { who: 'IT 与数字化', text: '整套可私有化；模型、权限、审计一套管。' },
        { who: '财务', text: '用量可度量、预算可分配、账单可追溯。' },
        { who: '一线员工', text: '待办有人接，Prompt 与 Skill 自己配；人专注判断与见客。' },
        { who: '生态伙伴', text: '应用上架即接入商汤底座与客户，以加油送车分享收益。' },
      ] },
      { type: 'band', label: '一句话', text: '<em>不止 AI 辅助工具</em>：能跑在组织里的 Agent 团队，模块可单独采购、整套可私有化。' },
      { type: 'cards', en: 'HOW TO BUY', title: '三种采购组合：<em>整体交付，也可从一个模块切入</em>', cols: 3, items: [
        { cap: '整体采购', title: '小浣熊企服版全套', points: ['商汤小浣熊 ＋ Raccoon X ＋ MaaS 平台', '整套私有化或云端 SaaS 多租户', '适合：一次规划销售、项目与团队 AI 的企业'] },
        { cap: '从应用切入', title: '一个 Buddy ＋ 平台', points: ['SalesBuddy 或 ProjectBuddy 先跑起来', '配 Raccoon X 与 Token Plan', '适合：有明确业务场景、想先见效的企业'] },
        { cap: '从平台切入', title: 'MaaS ＋ Raccoon X', points: ['Token Plan 与 API 统一接入模型', '在 Raccoon X 上自建智能体与应用', '适合：有开发团队、想自建场景的企业'] },
      ] },
      { type: 'table', en: 'CATALOG', title: '产品与模块清单', head: ['产品 / 模块', '说明', '采购形态', '交付'], rows: [
        ['小浣熊企服版（整体）', '4+N+X 应用 ＋ Raccoon X ＋ MaaS 平台', '整体采购', '私有化 · 云端'],
        ['SalesBuddy · 销售小浣熊', '过程留痕、经营判断、行动建议', '单独采购 · 组合', '私有化 · 云端'],
        ['ProjectBuddy · 项目小浣熊', '项目过程管理、Action 闭环与绩效考核', '单独采购 · 组合', '私有化 · 云端'],
        ['伙伴行业与 Agent（N ＋ X）', '伙伴 ISV 提供的行业方案与场景 Agent', '按伙伴方案', '按伙伴方案'],
        ['Raccoon X 智能体平台', '专家智能体、岗位助理、团队协作', '单独采购 · 组合', '私有化 · 云端'],
        ['MaaS · Token Plan / Token API', '按人按月订阅的模型权益，统一模型 API，按量计量', '单独采购 · 组合', '云端 · 私有化'],
        ['MaaS · 智能体与应用开发', '平台内含 Raccoon X 编排能力、X 工作台等', '随 MaaS 平台', '云端 · 私有化'],
        ['原厂落地陪跑 · 定制开发', '需求梳理、配置、培训带教、持续运营；定制按项目', '服务', '—'],
      ] },
      { type: 'band', label: '常见切入点', text: '有销售团队 → <em>SalesBuddy</em> · 项目多、交付重 → <em>ProjectBuddy</em> · 要建 Agent 团队 → <em>Raccoon X</em> · 模型与 Key 分散 → <em>MaaS 平台</em>' },
    ],
    note: '云端按智能体与 Token / Token Plan 使用；应用、平台、私有化部署与落地陪跑按具体商务方案报价。',
  },
  apps: {
    group: 'rb', name: 'AI 应用', cn: '4+N+X', color: 'red', kicker: 'AI APPS',
    slogan: '商汤小浣熊 ＋ 伙伴 ISV 的 N 个行业方案与 X 个场景 Agent',
    position: '小浣熊企服版的应用层：4 是商汤自建的小浣熊（xBuddies）；N ＋ X 主要由伙伴 ISV 提供，分行业与场景，基于 Raccoon X 开发。所有应用共用一套知识库、Memory 与 Token Plan 计量。',
    quote: '真正服务企业的 xBuddies，多场景AI业务伙伴，可横向扩展销售、人力、运营、客服、IT等模块',
    sections: [
      { type: 'cards', en: '4 · XBUDDIES', title: '商汤小浣熊', lead: '商汤自建，随小浣熊企服版提供，可单独采购。', cols: 2, items: [
        { cap: 'SalesBuddy', title: '销售小浣熊', text: '记录每一次沟通，让AI助力销售增长。', href: '/solutions/salesbuddy' },
        { cap: 'ProjectBuddy', title: '项目小浣熊', text: '目标导向的过程管理：AI 拆解每日 Action，Agent 执行、真人确认。', href: '/solutions/projectbuddy' },
      ] },
      { type: 'cards', en: 'N + X · PARTNER ISV', title: '伙伴 ISV：<em>分行业与场景</em>', lead: '伙伴以加油送车模式加入，商汤提供 Token。', cols: 2, items: [
        { cap: 'N · 行业', title: '行业方案', text: '伙伴 ISV 提供 N 个行业的方案，基于 Raccoon X 开发，上架小浣熊企服版。', href: '/solutions/partner-isv#industry', more: '按行业看' },
        { cap: 'X · 场景', title: '场景 Agent', text: '伙伴 ISV 基于 Raccoon X 搭建 X 个 Agent，按需组合。', href: '/solutions/partner-isv#scenario', more: '按场景看' },
      ] },
      // 套册「N ＋ X：伙伴 ISV 提供行业方案与 Agent」
      { type: 'table', en: '4 + N + X', title: '4 ＋ N ＋ X：<em>谁提供、怎么接入</em>', head: ['4 ＋ N ＋ X', '谁提供', '是什么', '怎么接入'], rows: [
        ['4 · 商汤小浣熊', '商汤', 'SalesBuddy、ProjectBuddy 等', '随小浣熊企服版提供，可单独采购'],
        ['N · 行业', '伙伴 ISV', 'N 个行业的方案', '基于 Raccoon X 开发，上架小浣熊企服版'],
        ['X · Agent', '伙伴 ISV', 'X 个 Agent', '基于 Raccoon X 搭建，按需组合'],
        ['共用底座', '商汤', '一套知识库、一套 Memory、统一权限与审计、统一 Token 计量', '伙伴不重复建设，专注行业与场景'],
      ] },
      { type: 'cards', attach: true, cols: 3, tone: 'soft', items: [
        { cap: '伙伴 ISV', title: '做行业方案与 Agent', text: '做实施、定制与运营。' },
        { cap: '商汤', title: '提供 Token 与平台', text: 'Raccoon X ＋ MaaS 平台。' },
        { cap: '客户', title: '开箱即用', text: '按 Token 用量付费。' },
      ] },
      { type: 'band', label: '加入方式', text: '<em>加油送车</em>：伙伴的行业方案与 Agent 是「车」，商汤提供 Token 做「油」，客户按用量付费。', href: '/partners#isv', more: '看伙伴 ISV 怎么加入' },
    ],
  },
  'partner-isv': {
    group: 'rb', parent: 'apps', name: '伙伴 ISV 方案', cn: 'N ＋ X · 分行业与场景', color: 'red', kicker: 'PARTNER ISV',
    slogan: '行业方案与场景 Agent，由伙伴 ISV 基于 Raccoon X 提供。',
    position: '4+N+X 里的 N ＋ X 主要由伙伴 ISV 提供：N 是按行业组织的方案，X 是按业务场景搭建的 Agent。都基于 Raccoon X 开发，上架小浣熊企服版，与商汤小浣熊共用一套知识库、Memory 与 Token 计量；客户按 Token 用量付费。',
    sections: [
      { type: 'cards', id: 'industry', en: 'N · BY INDUSTRY', title: 'N · 行业方案：<em>按行业组织</em>', lead: '伙伴 ISV 提供 N 个行业的方案。', cols: 3, items: [
        { cap: '谁提供', title: '深耕行业的伙伴 ISV', text: '做行业方案的实施、定制与运营。' },
        { cap: '怎么做', title: '基于 Raccoon X 开发', text: '不自建底座，与商汤小浣熊共用一套知识库、Memory、统一权限与审计。' },
        { cap: '怎么上架', title: '上架小浣熊企服版', text: '统一品牌、统一入口，客户按 Token 用量付费。' },
      ] },
      { type: 'cards', id: 'scenario', en: 'X · BY SCENARIO', title: 'X · 场景 Agent：<em>按业务场景组织</em>', lead: '伙伴 ISV 基于 Raccoon X 搭建 X 个 Agent，按需组合。', cols: 3, items: [
        { cap: '是什么', title: '面向具体场景的 Agent', text: '基于 Raccoon X 搭建，读同一套知识库与 Memory。' },
        { cap: '怎么用', title: '按需组合', text: '与商汤小浣熊、行业方案组合使用。' },
        { cap: '怎么计量', title: 'Token 统一计量', text: '调用经 MaaS 平台，按 Token Plan 或 Token API 计量。' },
      ] },
      { type: 'band', label: '加入方式', text: '<em>加油送车</em>：伙伴的行业方案与 Agent 是「车」，商汤提供 Token 做「油」，客户按用量付费。', href: '/partners#isv', more: '看伙伴 ISV 怎么加入' },
    ],
  },
  salesbuddy: {
    group: 'rb', parent: 'apps', name: 'SalesBuddy', cn: '销售小浣熊', color: 'red', kicker: 'SALESBUDDY',
    slogan: '记录每一次沟通，让AI助力销售增长。',
    position: '让销售投入更有成交回报：帮助企业判断哪些客户值得投入、商机真正卡在哪里，以及下一步谁该做什么。',
    problems: [
      { title: '资源投错', text: '客户优先级缺少共同依据，重复拜访与低价值跟进占用时间。' },
      { title: '推进卡住', text: '关键缺口和风险散落在沟通中。' },
      { title: '经验流失', text: '有效判断依赖少数资深人员，过程与结果难复盘。' },
    ],
    logic: [
      { title: '数据留痕', text: '语音录入、文件录入；客户与商机关联，业务事实按字段沉淀，缺失项保留「待确认」。' },
      { title: '数据辅助决策', text: '拜访建议、客户经营、商机推进、行动落实与协作复盘，建议写到动作层面。' },
      { title: '数据训练模型', text: '以业务反馈和实际结果训练模型，持续评测；这是后续演进方向。' },
    ],
    features: ['过程留痕', '经营判断', '行动建议', '知识问答', '内容生成', '微信小程序', 'PC 工作台', '管理后台'],
    values: ['一线少填表，不漏跟进', '主管早发现问题，辅导有依据', '管理层经营透明，每个数字可追溯', '把有效经验转为团队能力'],
    note: 'AI 给建议，业务人员作最终判断；效果指标与基线在试点前与客户共同确认。',
  },
  projectbuddy: {
    group: 'rb', parent: 'apps', name: 'ProjectBuddy', cn: '项目小浣熊', color: 'teal', kicker: 'PROJECTBUDDY',
    slogan: '先用起来，再长出方法论。',
    position: '目标导向的过程管理：以目标为导向，按项目拆解每个人每天的 Action，Agent 执行、真人确认，过程留痕，最优过程沉淀为 Know-How。',
    problems: [
      { title: '工具只管任务清单', text: '记了要做什么，没记怎么做成。' },
      { title: '过程没有留痕', text: 'Deliverable 散落各处，版本难追溯。' },
      { title: '最优做法带不走', text: '做成的经验留在个人手里。' },
    ],
    logic: [
      { title: '一套项目逻辑', text: '售前、交付、产品、专项是一个项目模块的四种类型，同一套字段、节点流、负责人与视图。' },
      { title: 'Action 闭环', text: '分解 → 分配 → 进展 → 关闭，单独成视图，追踪到人。' },
      { title: '绩效考核', text: '项目工作量、任务完成质量（AI 评分，团队负责人确认）与完成率、销售业绩（取自 SalesBuddy），按岗位与人配置权重。' },
    ],
    features: ['Action 拆解', '今日编排', '关口检查', '售前整理', '对齐检查', '汇报生成', '版本说明', 'PC Web 工作台'],
    values: ['目标到动作一条线', '人只做关键确认', '过程全留痕，版本可回溯', 'Know-How 持续优化执行路径'],
    note: 'AI 能力由 Raccoon X 支撑：专家智能体团队与个人 AI 助理协作，业务逻辑在 Raccoon X 上配置。',
  },
  'raccoon-x': {
    group: 'rb', name: 'Raccoon X', cn: '智能体平台', color: 'violet', kicker: 'RACCOON X',
    slogan: 'Agent 干活，真人只做提需求、确认任务、确认内容、见客。',
    position: '小浣熊企服版的智能体平台：专家智能体团队 ＋ 按岗位的个人 AI 助理，团队协作把目标、任务、项目打通。',
    problems: [
      { title: 'AI 停在个人工具', text: '各用各的，干不成团队的活。' },
      { title: '知识与记忆不相通', text: '人走经验走，回答没有出处。' },
      { title: '配置与权限散落', text: 'Prompt、技能、权限各管各的，无法审计。' },
    ],
    logic: [
      { title: '两种逻辑', text: '专家智能体团队服务 AI Native 业务；按岗位的个人 AI 助理协同工作。' },
      { title: '团队协作', text: '指挥官 → Leader → 个人助理，按真实组织派活与汇报；目标、任务、项目打通。' },
      { title: '一套知识库与 Memory', text: '多模态 RAG 知识库与三层 Memory，多 Agent 共用，读写不超过本人权限。' },
    ],
    features: ['Raccoon X 工作台', '可配置的 Skill / Prompt', '多 Agent 编排', '管控平面', '统一 Memory', '多模态知识库', '审计与计量', '待办拉通'],
    values: ['从个人工具到团队协作', '真人只做关键四件事', '组织记得住，人走资产留', '每一步可追溯，用量到人'],
    note: '管控在层外，不在 Prompt 里：中高风险动作暂停，等真人确认。',
  },
  maas: {
    group: 'rb', name: 'MaaS 平台', cn: '国内 · 海外 · 私有化', color: 'blue', kicker: 'MAAS PLATFORM',
    slogan: '一个入口，模型与用量管到人。',
    position: '小浣熊企服版的 MaaS 平台：API 网关统一接入模型，Token Plan 账户体系把权益逐级分配到人，计量｜计费｜账单｜支付一本账，内含 Raccoon X 智能体编排；可随企服版私有化部署，也提供云端 SaaS 多租户。',
    problems: [
      { title: '模型接入分散', text: '每个模型一套 Key 与调用方式。' },
      { title: '用量说不清', text: '预算难分配，成本难回溯到人。' },
      { title: '开发平台重复建', text: '智能体与应用开发各起一套。' },
      { title: '数据不能出企业', text: '部分业务有合规与本地化要求。' },
    ],
    logic: [
      { title: '一个入口', text: 'API 网关统一接入，一个账号、一个 API Key。' },
      { title: '多模型可选', text: 'SenseNova 日日新、开源与第三方大模型、本地模型，按需选择，换模型只改模型名。' },
      { title: 'Token Plan 四层账户', text: '集团 → 分子公司 → 部门 → 个人，逐级分配。' },
      { title: '计量 · 计费 · 账单 · 支付', text: '用量计量到人，账单可对，订阅或充值支付。' },
      { title: '一站式开发', text: '含 Raccoon X 编排：智能体开发与应用开发。' },
    ],
    values: ['一次接入，换模型只改模型名', '额度逐级分配，预算可管控', '从模型调用到智能体与应用，一个平台到底', '可随企服版私有化，数据不出企业'],
    sections: [
      { type: 'steps', en: 'API GATEWAY', title: 'API 网关：<em>一次接入，多模型可选</em>', items: [
        { title: '调用方', text: '业务系统、编程工具、智能体，统一用一个 API Key。' },
        { title: 'API 网关', text: '鉴权、路由、限流，按模型名分发。' },
        { title: '模型', text: 'SenseNova、开源、第三方与本地模型，按需选择。' },
        { title: 'Token Plan', text: '用量计入个人或部门权益，可查可对账。' },
      ] },
      { type: 'steps', en: 'ACCOUNTS', title: 'Token Plan 四层账户：<em>权益穿透到人</em>', items: [
        { title: '集团', text: '统一采购，建组织树，向下级下发，看全集团用量。' },
        { title: '分子公司', text: '承接集团权益，开通部门，划拨与代开通。' },
        { title: '部门', text: '席位绑定到人，应用建 Key，按成员查询用量。' },
        { title: '个人', text: '一个席位与套餐额度，编程工具与 API 登录即用。' },
      ] },
      { type: 'cards', en: 'DELIVERY', title: '两种交付', cols: 2, items: [
        { cap: '私有化部署', title: '数据不出企业', text: '随小浣熊企服版部署在客户本地，国内私有化用国内版；可利用客户已有算力。', href: '/solutions/services', more: '看部署形态' },
        { cap: '云端 SaaS 多租户', title: '开通即用', text: '国内平台 token.sensetime.com 与海外平台，智能体 ＋ Token Plan ＋ 模型 API 全套提供。', href: '/cloud-maas', more: '了解云端 MaaS' },
      ] },
    ],
    features: ['API 网关', 'Token Plan', 'Token API', '计量 · 计费', '账单 · 支付', '智能体开发', '应用开发'],
    note: '国内、海外两个云端平台的定价、套餐、模型及支付结算各自独立；私有化部署用国内版。',
  },
  'model-api': {
    group: 'ext', name: '模型 API', cn: 'SenseNova 日日新', color: 'slate', kicker: 'MODEL API',
    slogan: '商汤自研和开源大模型，经 MaaS 平台统一接入。',
    position: '模型 API 服务：SenseNova 日日新，商汤自研和开源大模型，LLM 与多模态；云端 API 经 MaaS 平台接入与计量，私有化时接入本地模型；可聚合第三方大模型（含闭源），换模型只改模型名。',
    problems: [
      { title: '模型接入分散', text: '云端、本地模型各接各的。' },
      { title: '换模型成本高', text: '切换模型就要改业务系统。' },
      { title: '数据边界要求', text: '部分业务要求模型在本地运行。' },
      { title: '用量说不清', text: '模型调用难以统一计量。' },
    ],
    logic: [
      { title: 'SenseNova 日日新', text: '商汤自研和开源大模型，LLM 与多模态。' },
      { title: '多模态输入', text: '支持文本、图片输入。' },
      { title: '云端 API', text: '经 MaaS 平台接入与调用。' },
      { title: '私有化', text: '私有化部署时接入本地模型。' },
      { title: '第三方聚合大模型', text: '含闭源模型，换模型只改模型名。' },
      { title: '统一计量', text: '模型调用经 MaaS 平台与 Token Plan 计量。' },
    ],
    values: ['一次接入：换模型只改模型名', '文本与图片都能用：LLM 与多模态按需选用', '云端本地都能接：云端 API，或私有化接入本地模型', '用量可计量：经 MaaS 平台与 Token Plan 统一计量'],
    sections: [
      { type: 'table', en: 'ACCESS', title: '云端与私有化：<em>两种接入方式</em>', head: ['对比项', '云端 API', '私有化部署'], rows: [
        ['模型', '商汤自研和开源大模型；第三方聚合大模型（含闭源）', '接入本地模型'],
        ['接入', '经 MaaS 平台调用 API', '本地模型经 MaaS 平台接入'],
        ['算力', '无需自建算力', '使用客户已有算力；不足时租赁补充'],
        ['计量', 'MaaS 平台与 Token Plan', 'MaaS 平台与 Token Plan'],
        ['适合', '没有算力、希望快速用上模型的企业', '数据边界明确、已有算力的企业'],
      ] },
      { type: 'cards', en: 'PLATFORMS', title: '按业务所在地选平台', cols: 3, items: [
        { cap: '国内业务', title: '用国内版 MaaS 平台', text: '按国内版模型清单选用模型。', href: '/cloud-maas#cn', more: '看国内平台' },
        { cap: '出海业务', title: '用海外版 MaaS 平台', text: '海外版模型清单与国内版各自独立。', href: '/cloud-maas#os', more: '看海外平台' },
        { cap: '换模型', title: '只改模型名', text: '第三方聚合大模型按需选用，业务系统不用重接。' },
      ] },
    ],
  },
  'compute-rental': {
    group: 'ext', name: '算力租赁', cn: '按需租用商汤算力', color: 'slate', kicker: 'COMPUTE RENTAL',
    slogan: '已有算力不足时按需补充；不自建算力，也能直接用云端模型 API。',
    position: '算力租赁：按需租用商汤算力，在客户已有算力不足时补充；模型调用统一经 MaaS 平台与 Token Plan 计量。',
    sections: [
      { type: 'cards', en: 'WHAT IT IS', title: '是什么', cols: 3, items: [
        { title: '按需租用', text: '租用商汤算力，按需使用。' },
        { title: '补充已有算力', text: '客户已有算力不足时补充。' },
        { title: '不自建也能用', text: '直接用云端 MaaS 模型 API。', href: '/cloud-maas', more: '看云端 MaaS' },
      ] },
      { type: 'cards', en: 'HOW TO USE', title: '怎么用', cols: 2, tone: 'soft', items: [
        { title: '与已有算力组合', text: '补充客户已有算力，组合使用。' },
        { title: '统一计量', text: '模型调用经 MaaS 平台，按 Token Plan 计量。' },
      ] },
      { type: 'table', en: 'BY SITUATION', title: '按算力情况选', head: ['客户情况', '算力租赁', '模型 API'], rows: [
        ['已有算力', '—', '接入本地模型，也可经 MaaS 平台用云端模型'],
        ['算力不足', '按需租用商汤算力补充', '或经 MaaS 平台接入云端模型'],
        ['没有算力', '—', '直接用云端 MaaS 模型 API（SaaS 多租户）'],
      ] },
      { type: 'band', label: '组合方式', text: '已有算力不足时租赁补充；<em>模型调用统一走 MaaS 平台与 Token Plan</em>。' },
    ],
  },
  services: {
    group: 'svc', name: '部署与落地陪跑', cn: '私有化 · 云端 · 混合', color: 'red', kicker: 'DEPLOYMENT & SERVICES',
    slogan: '同一套小浣熊企服版，三种部署形态；商汤原厂落地陪跑，小步验证。',
    position: '按数据边界与已有算力选部署形态：私有化、云端 SaaS 多租户或混合；商汤原厂落地陪跑负责需求梳理、配置、培训带教与持续运营，定制开发按项目评估。',
    sections: [
      { type: 'cards', en: 'DEPLOYMENT', title: '三种部署形态', cols: 3, items: [
        { cap: '私有化部署', title: '整套在企业内', text: '小浣熊企服版整套部署在客户本地，可利用客户已有算力。', foot: '适合：数据边界明确的行业，如金融、政企、国央企' },
        { cap: '云端 SaaS 多租户', title: '开通即用', text: '按智能体与 Token / Token Plan 使用；国内、海外两个平台。', foot: '适合：希望轻量起步、快速验证的企业', href: '/cloud-maas', more: '看云端 MaaS' },
        { cap: '混合部署', title: '本地 ＋ 云端', text: '本地算力不足的部分，租赁商汤算力或用云端。', foot: '适合：已有算力的企业、集团型企业' },
      ] },
      { type: 'table', en: 'BY LAYER', title: '每一层怎么部署', head: ['层', '私有化部署', '云端 SaaS 多租户', '混合部署'], rows: [
        ['AI 应用 · Raccoon X', '本地部署', '云端多租户', '本地部署'],
        ['MaaS 平台', '国内私有化版', 'token.sensetime.com 或海外版', '国内私有化版 ＋ 云端'],
        ['模型 API', '本地模型', '云端 API', '本地模型 ＋ 云端模型'],
        ['算力', '客户已有算力', '—', '已有算力 ＋ 算力租赁或云端'],
      ] },
      { type: 'steps', en: 'LANDING', title: '落地路径：<em>原厂陪跑，小步验证</em>', items: [
        { title: '诊断与共识', text: '梳理业务场景与痛点，确定切入模块与范围，共同确认验证指标与基线。', out: '场景清单 · 验证指标' },
        { title: '试点验证', text: '选一个团队或场景先跑，知识入库与配置，按基线评估效果。', out: '试点评估报告' },
        { title: '推广上线', text: '扩展到更多团队与模块，培训带教形成使用习惯，权限、审计与计量就位。', out: '上线清单 · 培训记录' },
        { title: '持续运营', text: '周期复盘与优化，经验沉淀为标准件与知识，按需叠加新模块。', out: '运营复盘 · 标准件' },
      ] },
      { type: 'cards', en: 'SERVICES', title: '服务与合作', cols: 4, tone: 'soft', items: [
        { title: '原厂落地陪跑', text: '客户成功服务：需求梳理、配置、培训带教、持续运营。' },
        { title: '定制开发', text: '按项目评估，交付范围与节奏写进项目计划。' },
        { title: '私有化交付', text: '整套部署在客户本地，客户掌握数据、内容标准与终审权。' },
        { title: '伙伴 ISV 上架', text: '加油送车模式：行业方案与 Agent 上架小浣熊企服版。', href: '/partners#model', more: '看商业模式' },
      ] },
      { type: 'band', label: '承诺方式', text: '<em>用证据说话</em>：不预设提升幅度，指标与基线与客户共同确认；交付范围与节奏写进项目计划，按计划验收。' },
    ],
  },
};

module.exports = { SITE, HERO, ABOUT, MAP, METHOD, GROW, CTA, CATALOG, SOLUTIONS, CLOUD, PARTNER, EVENTS, EVENT_KINDS, CAREERS, COMMUNITY, CONTACT, PRODUCTS };
