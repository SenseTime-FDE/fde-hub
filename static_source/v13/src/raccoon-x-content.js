'use strict';

// 依据用户提供的《Raccoon X 智能体中台｜产品介绍与上手指南》整理。
// 图片为该指南原图；实操使用虚构资料。复用 SalesBuddy 的展示组件。
// 不将未验收的三级组织派活、长期 Memory、部门预算治理写成现有能力。
module.exports = {
  description: 'Raccoon X 智能体平台，将模型、知识、工具与工作方法组合为个人助手、专家团队和业务流程，让企业 AI 应用可使用、可复用、可维护。',
  capabilities: [
    {
      id: 'agent', name: 'Agent', category: '专业助手', en: 'A SPECIALIST FOR YOUR WORK',
      title: '给每一类工作，配一个专业助手。',
      text: '从资料整理、专业问答到销售材料准备，为助手明确职责，再配上它需要的模型、知识和工具。业务人员用自然语言提出任务，也可以继续追问和调整结果。',
      points: ['用提示词定义职责、处理规则与输出格式', '按需组合参考文件、Skills、工具与知识检索', '配置后发布，通过 Web 入口使用并持续迭代'],
      outcome: '适合：资料整理、材料起草、产品问答、销售准备。',
      image: 'agent.jpg', width: 1470, height: 779,
      alt: 'Raccoon X Agent 配置界面，展示模型、提示词、Skill 与发布状态',
      caption: 'Agent 配置 · 为业务资料整理助手设置工作规则',
    },
    {
      id: 'teams', name: 'Agent Teams', category: '专家协作', en: 'EXPERTS WORKING TOGETHER',
      title: '让不同专家，各尽所长。',
      text: '当任务需要多个视角时，由团长安排分工、检查意见并汇总成果。专家各自承担提取、分析、复核等职责，让工作在团队里接续。',
      points: ['从已发布 Agent 中选择团长与专家', '明确任务目标、专家分工与最终答案要求', '查看协作过程、成员执行情况与汇总结果'],
      outcome: '适合：多角度分析、资料交叉核对、报告协作。',
      image: 'teams.png', width: 1833, height: 913,
      alt: 'Raccoon X Agent Teams 专家团配置，展示团队任务、分工方式与发布状态',
      caption: 'Agent Teams 配置 · 已发布的业务资料整理专家团示例',
    },
    {
      id: 'workflow', name: 'Workflow / Chatflow', category: '业务流程', en: 'REPEATABLE BUSINESS FLOWS',
      title: '把成熟做法，变成可重复的流程。',
      text: '用节点、连线和变量，把输入、模型、Agent、知识检索与输出串起来。Workflow 处理步骤明确的任务；Chatflow 在流程中承接多轮对话。',
      points: ['按业务需要组合处理节点、条件分支和工具', '在画布上配置执行路径与数据传递', '测试运行、检查结果，再发布给业务使用者'],
      outcome: '适合：标准化资料处理、重复业务任务、多轮知识问答。',
      image: 'workflow.jpg', width: 1470, height: 779,
      alt: 'Raccoon X 工作流画布，连接用户输入、Agent 与输出节点',
      caption: 'Workflow 编排 · 用户输入 → 资料整理 Agent → 报告输出',
    },
  ],
  resources: [
    { no: '01', en: 'KNOWLEDGE', title: '知识库', question: '依据什么资料？', text: '把制度、产品文档、操作手册和项目资料变成可检索的业务依据，供 Agent 与流程选用。', items: ['导入文档与处理分段', '自定义知识流水线', '连接外部知识库'] },
    { no: '02', en: 'SKILLS', title: 'Skills', question: '按什么方法工作？', text: '将专业指令、参考文件和必要脚本整理为可复用的方法，让同类任务沿用一致的规范。', items: ['自然语言准备 Skill 草稿', '编辑、发布与版本维护', '在多个 Agent 中复用'] },
    { no: '03', en: 'TOOLS & MODELS', title: '模型与工具', question: '调用什么能力？', text: '集中管理模型和外部连接，通过工具、MCP 或 API，让助手按授权范围使用业务系统的能力。', items: ['按用途配置模型', '工具插件与 MCP 服务', '连接现有业务 API'] },
  ],
  workflow: [
    ['明确任务', '选定一类业务工作，定义输入、输出与完成标准。'],
    ['组合能力', '选模型，配提示词，按需添加知识、Skills 和工具。'],
    ['验证结果', '用真实任务的代表性样例，核对事实、格式与缺失信息。'],
    ['发布使用', '发布应用，通过 Web 或已配置的业务入口投入使用。'],
    ['持续迭代', '结合日志、监控和使用反馈，调整配置与发布版本。'],
  ],
  faq: [
    ['该选 Agent、Agent Teams，还是 Workflow？', '单一职责、需要继续追问的任务，可以从 Agent 开始；需要多个专家交叉分析和复核时，选择 Agent Teams；执行路径明确、需要重复运行时，选择 Workflow。需要多轮对话与流程控制时，可选 Chatflow。'],
    ['知识库和 Skills 有什么区别？', '知识库提供回答和分析的资料依据，Skills 提供处理任务的方法与规范。两者可以同时配置给 Agent：先找到相关资料，再按既定方法完成工作。'],
    ['能接入飞书、企业微信和已有系统吗？', 'Agent 与 Agent Teams 提供消息渠道配置入口；平台也支持 Web 应用与服务 API。飞书、企业微信等渠道需要管理员完成应用配置、授权和联调，具体可用范围以交付版本及企业配置为准。'],
    ['怎样从一个小场景开始？', '先选择资料整理、制度问答或销售材料准备等边界清晰的任务，准备资料与验证样例，跑通一个 Agent。再按需要增加知识库、Skills，或扩展为专家团队与工作流。'],
  ],
};
