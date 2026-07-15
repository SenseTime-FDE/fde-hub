/* ============================================================
   商汤 FDE · 对外宣传页 — 数据配置
   —— 日常维护只需编辑这个文件 ——
   ============================================================ */

/* 顶部分类筛选标签。key 必须与 PROJECTS 的 cat 对应。"all" 保留在第一位。 */
const CATEGORIES = [
  { key: "all",      label: "全部 All" },
  { key: "expo",     label: "会展 Expo" },
  { key: "food",     label: "餐饮 F&B" },
  { key: "hr",       label: "人力 HR" },
  { key: "sales",    label: "销售 Sales" },
  { key: "industry", label: "工业 Industry" },
  { key: "legal",    label: "法律 Legal" },
];

/* 六大核心角色（取自 FDE 介绍）。num 为编号，title 标题，desc 说明。 */
/* 角色配图：均为 Unsplash 免版权图（Unsplash License，可商用、免署名），
   通过官方图床直接引用。要换图把 img 换成新的 Unsplash 图床地址即可。 */
const U = (id) => `https://images.unsplash.com/photo-${id}?q=80&w=900&auto=format&fit=crop`;
const ROLES = [
  { num: "01", icon: "convert",  img: U("1758518729685-f88df7890776"), title: "客户需求翻译器", desc: "将客户模糊需求转化为清晰的业务场景和技术需求。" },
  { num: "02", icon: "design",   img: U("1523961131990-5ea7c61b2107"), title: "AI 场景设计师", desc: "基于商汤模型、Token Plan、SoWork、X-Design、Agent 等能力设计解决方案。" },
  { num: "03", icon: "demo",     img: U("1754039984985-ef607d80113a"), title: "Demo / PoC 推动者", desc: "快速构建可演示、可验证、可试用的场景样板。" },
  { num: "04", icon: "feedback", img: U("1677506048148-0c914dd8197b"), title: "产品反馈收集者", desc: "将客户真实问题反馈给产品与研发团队，推动能力持续优化。" },
  { num: "05", icon: "flag",     img: U("1521791136064-7986c2920216"), title: "价值交付陪跑者", desc: "陪伴客户完成试点、上线、培训、复盘和扩容。" },
  { num: "06", icon: "layers",   img: U("1695668548342-c0c1ad479aee"), title: "场景资产沉淀者", desc: "将一次性客户经验沉淀为可复制方案、模板和 SOP。" },
];

/* FDE 对客户的价值（取自 FDE 介绍）。 */
const VALUES = [
  { title: "更快找到场景", desc: "帮客户从业务流程中找到最适合 AI 切入的点。" },
  { title: "更快看到 Demo", desc: "快速构建可验证样板，降低试错成本。" },
  { title: "更快推动试点", desc: "陪跑客户完成 PoC、培训和反馈。" },
  { title: "更易形成共识", desc: "帮客户准备方案、价值说明和试点结果。" },
  { title: "更易规模化使用", desc: "沉淀模板、流程和方法，方便推广到更多部门。" },
  { title: "更易衡量价值", desc: "用使用数据、效率提升与业务贡献，清晰评估落地效果。" },
];

/* ============================================================
   Demo 作品列表。新增一个 Demo = 加一个对象。
   网页类：填 url（卡片显示实时预览、点击新标签打开）。
   小程序类：type:"qr"，填 qr 指向 images/ 里的二维码图片。
   公共字段：cat / badge / title / desc / tags / hue
   网页类专用：url / live      小程序类专用：type:"qr" / qr
   （含中文的 url 请先 encodeURI 编码）
   ============================================================ */
const PROJECTS = [
  {
    cat: "expo", badge: "会展 Expo", title: "展位推荐 Agent",
    desc: "为参展商智能匹配最优展位，提升招商效率。",
    tags: ["Agent", "推荐系统"],
    url: "https://sensetime-fde.github.io/Demo/%E4%B8%87%E8%80%80%E4%BC%81%E9%BE%99%E5%B1%95%E4%BD%8D%E6%8E%A8%E8%8D%90",
    hue: 18, live: true,
  },
  {
    cat: "expo", badge: "会展 Expo", title: "展位动态定价与推荐 Agent",
    desc: "基于供需的展位动态定价与智能推荐引擎。",
    tags: ["Agent", "动态定价"],
    url: "https://hey-0320-hey.github.io/booth-agent-demo/",
    hue: 8, live: true,
  },
  {
    cat: "food", badge: "餐饮 F&B", title: "点餐推荐助手 Agent",
    desc: "小程序点餐场景下的个性化菜品推荐助手。",
    tags: ["Agent", "小程序"],
    url: "https://sensetime-fde.github.io/Demo/%E7%82%B9%E9%A4%90%E5%8A%A9%E6%89%8B%E5%B0%8F%E7%A8%8B%E5%BA%8FAgent",
    hue: 28, live: true,
  },
  {
    cat: "hr", badge: "人力 HR", title: "HR 招聘 Agent",
    desc: "面向招聘全流程的智能助手，体验商汤招聘 AI Agent。",
    tags: ["Agent", "招聘"],
    url: "https://dashing-narwhal-d1b201.netlify.app/",
    hue: 0, live: true,
  },
  {
    cat: "industry", badge: "工业 Industry", title: "机械总成交互展厅",
    desc: "面向机械总成的 3D 交互展厅，沉浸式展示与讲解产品结构。",
    tags: ["交互展厅", "3D"],
    url: "https://sensetime-fde.github.io/Demo/%E6%9C%BA%E6%A2%B0%E6%80%BB%E6%88%90%E4%BA%A4%E4%BA%92%E5%B1%95%E5%8E%85",
    hue: 205, live: true,
  },
  {
    cat: "legal", badge: "法律 Legal", title: "案件时间线与证据梳理",
    desc: "自动梳理案件时间线、归集证据要点，辅助案情分析。",
    tags: ["Agent", "法律"],
    url: "https://sensetime-fde.github.io/Demo/%E6%A1%88%E4%BB%B6%E6%97%B6%E9%97%B4%E7%BA%BF%E4%B8%8E%E8%AF%81%E6%8D%AE%E6%A2%B3%E7%90%86",
    hue: 260, live: true,
  },
  {
    cat: "legal", badge: "法律 Legal", title: "合同审查助手",
    desc: "智能审查合同条款，识别风险点并给出修改建议。",
    tags: ["Agent", "合同审查"],
    url: "https://sensetime-fde.github.io/Demo/%E5%90%88%E5%90%8C%E5%AE%A1%E6%9F%A5%E5%8A%A9%E6%89%8BDemo",
    hue: 285, live: true,
  },
  {
    cat: "industry", badge: "工业 Industry", title: "设计图纸审核",
    desc: "面向设计图纸的智能审核，快速定位问题与不合规项。",
    tags: ["Agent", "图纸审核"],
    url: "https://sensetime-fde.github.io/Demo/%E8%AE%BE%E8%AE%A1%E5%9B%BE%E7%BA%B8%E5%AE%A1%E6%A0%B8Demo",
    hue: 160, live: true,
  },
  {
    "cat": "industry",
    "badge": "工业 Industry",
    "title": "水务需求分析报告",
    "desc": "面向供水营销管理系统，实现项目度量监控、功能流程拆解、需求文档智能质检一体化分析工作台。",
    "tags": ["Agent", "需求分析", "水务行业"],
    "url": "https://sensetime-fde.github.io/Demo/%E6%B0%B4%E5%8A%A1%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90_%E5%88%86%E6%9E%90%E6%8A%A5%E5%91%8A/",
    "hue": 160,
    "live": true
  },
  {
    "cat": "industry",
    "badge": "工业 Industry",
    "title": "水务需求沟通系统原型",
    "desc": "供水营销管理系统前端交互原型，支持账号登录、业务参数可视化调参，用于需求阶段客户直观预览系统页面效果。",
    "tags": ["Agent", "需求原型", "水务行业"],
    "url": "https://sensetime-fde.github.io/Demo/%E6%B0%B4%E5%8A%A1%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90_%E7%B3%BB%E7%BB%9F%E5%8E%9F%E5%9E%8B/",
    "hue": 160,
    "live": true
  },
  // —— 微信小程序：扫码体验（把二维码图片放进 images/ 文件夹）——
  {
    cat: "sales", type: "qr", badge: "销售 Sales", title: "工作管理效率小助手",
    desc: "销售工作管理效率助手 · 体验版，微信扫码即可体验。",
    tags: ["小程序", "Agent", "体验版"],
    qr: "images/img_v3_0212v_ac39fd3f-63ff-42e7-aebf-99f4b8b9c6dg.jpg",
    hue: 32,
  },
];

// 暴露给 main.js（普通 <script> 引入，无需打包工具）
window.FDE_DATA = { CATEGORIES, ROLES, VALUES, PROJECTS };
