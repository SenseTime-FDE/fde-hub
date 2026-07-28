/* ============================================================
   商汤 FDE · 对外宣传页 — 数据配置
   —— 日常维护只需编辑这个文件 ——
   ============================================================ */

/* 顶部分类筛选标签。key 必须与 PROJECTS 的 cat 对应。"all" 保留在第一位。 */
const CATEGORIES = [
  { key: "all",       label: "全部 All" },
  { key: "expo",      label: "展会营销 Expo" },
  { key: "retail",    label: "餐饮零售 Retail" },
  { key: "hr",        label: "人力招聘 HR" },
  { key: "care",      label: "医疗照护 Care" },
  { key: "sales",     label: "销售营销 Sales" },
  { key: "media",     label: "智能媒体 Media" },
  { key: "data",      label: "数据治理 Data" },
  { key: "platform",  label: "智能平台 Platform" },
  { key: "prototype", label: "业务原型 Prototype" },
  { key: "industry",  label: "工业制造 Industry" },
  { key: "legal",     label: "法律合规 Legal" },
  { key: "utilities", label: "水务能源 Utilities" },
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
    cat: "expo", badge: "展会营销", title: "展位推荐 Agent",
    desc: "面向展会招商与参展规划，结合展商诉求、展区位置和资源约束推荐合适展位。",
    tags: ["展位匹配", "招商提效", "推荐系统"],
    url: "https://sensetime-fde.github.io/Demo/%E4%B8%87%E8%80%80%E4%BC%81%E9%BE%99%E5%B1%95%E4%BD%8D%E6%8E%A8%E8%8D%90",
    hue: 18, live: true, featured: true,
  },
  {
    cat: "expo", badge: "展会营销", title: "展位动态定价与推荐 Agent",
    desc: "面向展位资源经营，基于供需热度、位置价值和客户偏好完成定价与推荐。",
    tags: ["动态定价", "展位推荐", "经营决策"],
    url: "https://hey-0320-hey.github.io/booth-agent-demo/",
    hue: 8, live: true,
  },
  {
    cat: "retail", badge: "餐饮零售", title: "点餐推荐助手 Agent",
    desc: "面向餐饮点单链路，依据用餐偏好、菜品组合和门店菜单推荐合适菜品。",
    tags: ["点餐推荐", "小程序", "个性化推荐"],
    url: "https://sensetime-fde.github.io/Demo/%E7%82%B9%E9%A4%90%E5%8A%A9%E6%89%8B%E5%B0%8F%E7%A8%8B%E5%BA%8FAgent",
    hue: 28, live: true, featured: true,
  },
  {
    cat: "hr", badge: "人力招聘", title: "HR 招聘 Agent",
    desc: "面向招聘全流程，辅助岗位理解、简历筛选、候选人沟通与招聘决策。",
    tags: ["招聘流程", "简历筛选", "候选人沟通"],
    url: "https://dashing-narwhal-d1b201.netlify.app/",
    hue: 0, live: true,
  },
  {
    cat: "care", badge: "医疗照护", title: "护工陪护 Agent",
    desc: "面向陪护服务咨询，收集照护需求、匹配服务方案并辅助完成下单前沟通。",
    tags: ["陪护服务", "需求采集", "服务匹配"],
    url: "https://sensetime-fde.github.io/Demo/%E6%8A%A4%E5%B7%A5%E9%99%AA%E6%8A%A4/",
    hue: 145, live: true,
  },
  {
    cat: "sales", badge: "销售营销", title: "白酒销售 Agent",
    desc: "面向白酒导购与客户经营，支持产品讲解、场景化推荐和销售话术生成。",
    tags: ["白酒行业", "导购助手", "销售话术"],
    url: "https://sensetime-fde.github.io/Demo/%E7%99%BD%E9%85%92/",
    hue: 36, live: true,
  },
  {
    cat: "sales", badge: "销售营销", title: "新品 Pitch 生成器",
    desc: "面向新品发布和客户提案，辅助生成结构化 Pitch 内容，用视频展示完整流程。",
    tags: ["新品提案", "Pitch 生成", "视频演示"],
    url: "https://my.feishu.cn/file/NLmYbwuyCoD3LBxmy31cmVNvnqd",
    hue: 12, live: false,
  },
  {
    cat: "media", badge: "智能媒体", title: "智媒平台",
    desc: "面向媒体内容生产与运营场景，提供智能化内容处理、协作和平台化能力演示。",
    tags: ["智能媒体", "内容生产", "平台演示"],
    url: "https://sensetime-fde.github.io/Demo/%E6%99%BA%E5%AA%92%E5%B9%B3%E5%8F%B0",
    hue: 330, live: true, featured: true,
  },
  {
    cat: "data", badge: "数据治理", title: "客户表单数据清理",
    desc: "面向客户表单和线索数据，演示字段规范化、脏数据识别和批量清洗流程。",
    tags: ["表单清洗", "字段规范化", "视频演示"],
    url: "https://my.feishu.cn/file/HPOabqIjWojRULxu8Xgcgv1AnQg",
    hue: 215, live: false,
  },
  {
    cat: "industry", badge: "工业制造", title: "机械总成交互展厅",
    desc: "面向机械总成展示与讲解，通过 3D 交互展厅呈现产品结构、部件关系和亮点。",
    tags: ["3D 展厅", "产品讲解", "机械总成"],
    url: "https://sensetime-fde.github.io/Demo/%E6%9C%BA%E6%A2%B0%E6%80%BB%E6%88%90%E4%BA%A4%E4%BA%92%E5%B1%95%E5%8E%85",
    hue: 205, live: true,
  },
  {
    cat: "legal", badge: "法律合规", title: "案件时间线与证据梳理",
    desc: "面向法律案情分析，自动抽取事件节点、组织证据材料并形成案件时间线。",
    tags: ["案件分析", "时间线", "证据梳理"],
    url: "https://sensetime-fde.github.io/Demo/%E6%A1%88%E4%BB%B6%E6%97%B6%E9%97%B4%E7%BA%BF%E4%B8%8E%E8%AF%81%E6%8D%AE%E6%A2%B3%E7%90%86",
    hue: 260, live: true, featured: true,
  },
  {
    cat: "legal", badge: "法律合规", title: "合同审查助手",
    desc: "面向合同审核，识别条款风险、提取关键义务并给出修改建议。",
    tags: ["合同审查", "风险识别", "条款建议"],
    url: "https://sensetime-fde.github.io/Demo/%E5%90%88%E5%90%8C%E5%AE%A1%E6%9F%A5%E5%8A%A9%E6%89%8BDemo",
    hue: 285, live: true,
  },
  {
    cat: "industry", badge: "工业制造", title: "设计图纸审核",
    desc: "面向工程设计图纸，辅助识别图纸问题、审核规范符合性并沉淀检查意见。",
    tags: ["图纸审核", "规范校验", "工程设计"],
    url: "https://sensetime-fde.github.io/Demo/%E8%AE%BE%E8%AE%A1%E5%9B%BE%E7%BA%B8%E5%AE%A1%E6%A0%B8Demo",
    hue: 160, live: true,
  },
  {
    "cat": "utilities",
    "badge": "水务能源",
    "title": "水务需求分析报告",
    "desc": "面向供水营销管理系统，自动拆解功能流程、质检需求文档并输出分析报告。",
    "tags": ["水务行业", "需求分析", "文档质检"],
    "url": "https://sensetime-fde.github.io/Demo/%E6%B0%B4%E5%8A%A1%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90_%E5%88%86%E6%9E%90%E6%8A%A5%E5%91%8A/",
    "hue": 160,
    "live": true
  },
  {
    "cat": "utilities",
    "badge": "水务能源",
    "title": "水务需求沟通系统原型",
    "desc": "面向水务系统需求沟通，提供可交互原型、业务参数调节和页面效果预览。",
    "tags": ["水务行业", "系统原型", "需求沟通"],
    "url": "https://sensetime-fde.github.io/Demo/%E6%B0%B4%E5%8A%A1%E9%9C%80%E6%B1%82%E5%88%86%E6%9E%90_%E7%B3%BB%E7%BB%9F%E5%8E%9F%E5%9E%8B/",
    "hue": 160,
    "live": true
  },
  {
    cat: "utilities", badge: "水务能源", title: "中海油 AI 方案",
    desc: "面向能源行业业务场景，展示 AI 方案设计、能力组合和落地路径。",
    tags: ["能源行业", "AI 方案", "方案展示"],
    url: "https://sensetime-fde.github.io/Demo/%E4%B8%AD%E6%B5%B7%E6%B2%B9AI%E6%96%B9%E6%A1%88",
    hue: 190, live: true, featured: true,
  },
  {
    cat: "platform", badge: "智能平台", title: "Agent Hub",
    desc: "面向 Agent 应用集中展示与管理，提供多 Agent 能力入口和场景化体验。",
    tags: ["Agent 平台", "能力中台", "应用入口"],
    url: "https://sensetime-fde.github.io/Demo/agent_hub",
    hue: 225, live: true, featured: true,
  },
  {
    cat: "prototype", badge: "业务原型", title: "报社业务原型",
    desc: "面向业务沟通与方案验证，提供可交互原型用于快速演示流程与页面。",
    tags: ["业务原型", "流程演示", "方案验证"],
    url: "https://sensetime-fde.github.io/Demo/baoshe_proto",
    hue: 26, live: true,
  },
  {
    cat: "prototype", badge: "业务原型", title: "君度业务原型",
    desc: "面向行业场景方案沟通，展示核心业务流程、页面结构和交互体验。",
    tags: ["业务原型", "行业场景", "交互演示"],
    url: "https://sensetime-fde.github.io/Demo/jundu_proto",
    hue: 172, live: true,
  },
  {
    cat: "platform", badge: "智能平台", title: "智能需求管理平台 Demo",
    desc: "面向需求管理与协作流程，展示需求收集、流转和管理的智能化体验。",
    tags: ["需求管理", "协作流程", "平台演示"],
    url: "https://sensetime-fde.github.io/Demo/%E6%99%BA%E8%83%BD%E9%9C%80%E6%B1%82%E7%AE%A1%E7%90%86%E5%B9%B3%E5%8F%B0%20Demo",
    hue: 230, live: true, featured: true,
  },
  {
    cat: "platform", badge: "文档演示", title: "需求管理平台文档",
    desc: "面向需求管理流程说明，提供飞书文档形式的方案介绍和演示入口。",
    tags: ["需求管理", "飞书文档", "方案说明"],
    url: "https://sensetime.feishu.cn/docx/UqW4dAQMlodT4jxJcZvcTpM7nJ6",
    type: "doc",
    hue: 240,
  },
  {
    cat: "prototype", badge: "业务原型", title: "LBS 业务原型",
    desc: "面向 LBS 业务场景，展示核心流程、页面结构和交互体验。",
    tags: ["LBS", "业务原型", "交互演示"],
    url: "https://sensetime-fde.github.io/Demo/lbs_proto",
    hue: 205, live: true,
  },
  // —— 微信小程序：扫码体验（把二维码图片放进 images/ 文件夹）——
  {
    cat: "sales", type: "qr", badge: "销售营销", title: "工作管理效率小助手",
    desc: "面向销售日常工作管理，提供任务跟进、信息记录和效率提升的小程序体验。",
    tags: ["销售管理", "工作提效", "小程序"],
    qr: "images/img_v3_0212v_ac39fd3f-63ff-42e7-aebf-99f4b8b9c6dg.jpg",
    hue: 32,
  },
];

// 暴露给 main.js（普通 <script> 引入，无需打包工具）
window.FDE_DATA = { CATEGORIES, ROLES, VALUES, PROJECTS };
