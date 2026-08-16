/* ============================================================================
 *  声渡 VoxOne · 业务数据种子(单一数据源)
 *  被后端 db.js 通过 new Function 载入(window.VX_SEED),也可被前端直接引用。
 *  data:  业务与配置(agents/knowledge/scripts/voices/campaigns/numbers/model/…)
 *  calls: 会话留痕演示样本(装入真表 calls,可继续增长)
 * ========================================================================== */
(function (w) {
  var iso = function (dOffsetH) { return new Date(Date.UTC(2026, 6, 16, 3, 0, 0) - (dOffsetH || 0) * 3600 * 1000).toISOString(); };

  // ---- 音色库(音色资产化:预置 + 零样本克隆)-------------------------------
  var voices = [
    { id: "v_lin",   name: "林向晚 · 品牌主音色", gender: "female", type: "clone",  langs: ["zh", "yue", "en"], clonedFrom: "品牌代言人 30s 参考音频", sampleText: "您好,这里是声渡智能助手", status: "on" },
    { id: "v_aria",  name: "Aria · 国际女声",     gender: "female", type: "preset", langs: ["en", "es", "ar", "id", "th"], clonedFrom: "", sampleText: "Hi, how can I help you today?", status: "on" },
    { id: "v_sales", name: "金牌销售 · 陈锐",      gender: "male",   type: "clone",  langs: ["zh", "en"], clonedFrom: "Top Sales 15s 参考音频", sampleText: "这款套餐更适合您的团队规模", status: "on" },
    { id: "v_calm",  name: "沉稳男声 · 顾维",      gender: "male",   type: "preset", langs: ["zh", "yue", "en", "ja"], clonedFrom: "", sampleText: "您的账户安全我们高度重视", status: "on" },
    { id: "v_warm",  name: "暖心女声 · 苏念",      gender: "female", type: "preset", langs: ["zh", "yue"], clonedFrom: "", sampleText: "别着急,我一步步帮您处理", status: "on" },
    { id: "v_mena",  name: "Layla · 中东女声",     gender: "female", type: "preset", langs: ["ar", "en"], clonedFrom: "", sampleText: "مرحبًا، كيف أساعدك؟", status: "on" },
    { id: "v_promo", name: "活力女声 · 小渡",      gender: "female", type: "preset", langs: ["zh", "en", "th", "vi"], clonedFrom: "", sampleText: "限时福利,错过可就没啦", status: "on" },
    { id: "v_esp",   name: "Mateo · 西语男声",     gender: "male",   type: "preset", langs: ["es", "pt", "en"], clonedFrom: "", sampleText: "Hola, ¿en qué puedo ayudarle?", status: "off" },
  ];

  // ---- 知识库(RAG 检索:keywords 命中 → answer)---------------------------
  var knowledge = [
    { id: "kb_ecom_refund", scenario: "ecom", title: "退换货政策与流程", keywords: ["退货", "退款", "退换", "refund", "return", "换货"], sopId: "sop_refund", sopTitle: "退换货 SOP", updated: iso(48),
      answer: "支持签收后 15 天内无理由退换。请在订单页点「申请退货」,系统会生成退货面单;商品寄回并质检通过后,原路退款 3–5 个工作日到账。生鲜/定制类除外。",
      answer_i18n: { en: "You can return within 15 days of delivery. Tap 'Request return' on the order page to get a prepaid label; refund is issued to the original method within 3–5 business days after inspection." } },
    { id: "kb_ecom_ship", scenario: "ecom", title: "物流与配送时效", keywords: ["物流", "快递", "发货", "配送", "运单", "tracking", "shipping", "delivery"], sopId: "", updated: iso(30),
      answer: "跨境订单标准时效为 7–12 个工作日,可在订单页查看实时运单轨迹。如超时未更新,我可为您发起物流查件工单。",
      answer_i18n: { en: "Cross-border orders typically arrive in 7–12 business days. You can track it on the order page; I can open a trace ticket if it's stuck." } },
    { id: "kb_ecom_promo", scenario: "ecom", title: "优惠券与满减", keywords: ["优惠券", "满减", "折扣", "coupon", "discount", "promo"], sopId: "", updated: iso(72),
      answer: "当前有跨店满 300 减 40 活动,优惠券可在结算页「使用优惠」处叠加平台券。券有有效期,建议尽快下单。" },
    { id: "kb_app_pay", scenario: "app", title: "充值未到账 / 内购问题", keywords: ["充值", "未到账", "内购", "钻石", "点券", "recharge", "purchase", "not received"], sopId: "sop_pay", sopTitle: "支付核验 SOP", updated: iso(20),
      answer: "内购通常几分钟内到账。若未到账,请提供订单号与充值时间,我为您核验支付渠道回执;确认扣款成功会即时补发并附赠补偿。",
      answer_i18n: { en: "In-app purchases usually arrive within minutes. Share your order ID and time — I'll verify the payment receipt and re-issue immediately with compensation if the charge went through." } },
    { id: "kb_app_login", scenario: "app", title: "账号登录 / 找回", keywords: ["登录", "登不上", "找回", "封号", "login", "cannot log in", "banned", "account"], sopId: "", updated: iso(15),
      answer: "请先确认登录方式(手机/邮箱/第三方)。若提示异常,可能触发风控保护,我可为您发起人工核身解封;封号申诉我会记录工单 24 小时内回复。" },
    { id: "kb_fin_kyc", scenario: "fintech", title: "身份核验 / KYC", keywords: ["实名", "认证", "核验", "身份", "kyc", "verify", "identity"], sopId: "sop_kyc", sopTitle: "KYC 合规核验 SOP", updated: iso(10),
      answer: "为保障资金安全,首次提现需完成身份核验:请准备证件正反面与本人手持照。全过程加密留痕、符合当地监管要求;通过后额度即时生效。",
      answer_i18n: { en: "For fund security, identity verification (KYC) is required before your first withdrawal: prepare both sides of your ID and a selfie. The flow is encrypted and compliant; limits apply instantly once approved." } },
    { id: "kb_fin_repay", scenario: "fintech", title: "还款 / 续费提醒", keywords: ["还款", "账单", "逾期", "续费", "repay", "bill", "overdue", "renew"], sopId: "", updated: iso(6),
      answer: "您的账单将于 3 日后到期,可在 App「我的账单」一键还款;如需分期,我可为您评估可用的分期方案。逾期会影响信用,建议按时处理。" },
    { id: "kb_fin_risk", scenario: "fintech", title: "交易风控 / 冻结", keywords: ["冻结", "风控", "限制", "交易失败", "frozen", "risk", "blocked"], sopId: "sop_kyc", sopTitle: "KYC 合规核验 SOP", updated: iso(8),
      answer: "检测到异常交易时系统会临时保护您的账户。请配合完成一次身份核验以解除限制;若为误判,核验通过后即可恢复正常交易。" },
    { id: "kb_local_book", scenario: "local", title: "预约与到店提醒", keywords: ["预约", "到店", "改期", "取消预约", "booking", "appointment", "reschedule"], sopId: "", updated: iso(24),
      answer: "已为您查到预约信息。如需改期或取消,请告诉我期望时间,我现在就为您调整并发送新的到店提醒。到店出示预约码即可。" },
    { id: "kb_local_course", scenario: "local", title: "课程咨询与试听", keywords: ["课程", "试听", "报名", "学费", "course", "trial", "enroll", "tuition"], sopId: "sop_lead", sopTitle: "线索资格审查 SOP", updated: iso(36),
      answer: "我们有面向不同基础的班型。为给您推荐合适的课程,请问学员目前的水平和目标是?我可以为您安排一次免费试听并锁定早鸟优惠。" },
    { id: "kb_auto_renew", scenario: "auto", title: "续保 / 保单查询", keywords: ["续保", "保单", "保费", "理赔", "renew", "policy", "premium", "claim"], sopId: "", updated: iso(18),
      answer: "您的车险将于本月底到期。续保可享老客户折扣,保障与去年一致且保费更优;我可以现在为您生成续保方案并发送到您手机确认。" },
    { id: "kb_auto_claim", scenario: "auto", title: "出险与理赔流程", keywords: ["出险", "理赔", "事故", "定损", "报案", "accident", "claim"], sopId: "", updated: iso(40),
      answer: "请先确保人身安全并在安全位置拍照取证。我为您在线报案并生成案件号,查勘定损会在 24 小时内联系您;小额可走线上快赔。" },
    { id: "kb_common_hours", scenario: "*", title: "服务时间与转人工", keywords: ["人工", "客服", "上班", "时间", "human", "hours", "agent"], sopId: "", updated: iso(60),
      answer: "我是 7×24 在线的 AI 助手,可随时为您服务;涉及复杂或需要授权的事项,我会带着完整上下文为您转接人工坐席。" },
    { id: "kb_common_privacy", scenario: "*", title: "隐私与录音说明", keywords: ["隐私", "录音", "个人信息", "数据", "privacy", "record", "data"], sopId: "", updated: iso(90),
      answer: "本次通话在合规授权下录音与转写,仅用于服务质量与问题追溯,数据加密存储。您有权要求查询或删除相关记录。" },
  ];

  // ---- 话术 / SOP(可推送到坐席)---------------------------------------------
  var scripts = [
    { id: "sop_refund", scenario: "ecom", mode: "service", title: "退换货 SOP", status: "on", pushCount: 12, updated: iso(48),
      steps: ["核对订单号与商品状态", "判断是否在 15 天无理由范围", "生成退货面单并说明质检时效", "告知退款到账口径 3–5 工作日", "情绪安抚 + 记录满意度"] },
    { id: "sop_pay", scenario: "app", mode: "service", title: "支付核验 SOP", status: "on", pushCount: 8, updated: iso(20),
      steps: ["收集订单号 + 充值时间", "核验支付渠道回执", "确认扣款是否成功", "成功即补发 + 补偿话术", "失败引导重试并说明退款"] },
    { id: "sop_kyc", scenario: "fintech", mode: "service", title: "KYC 合规核验 SOP", status: "on", pushCount: 15, updated: iso(10),
      steps: ["说明核验目的与合规依据", "引导上传证件与手持照", "强调全程加密留痕", "核验通过即时恢复额度", "留存合规凭证"] },
    { id: "sop_lead", scenario: "local", mode: "sales", title: "线索资格审查 SOP", status: "on", pushCount: 20, updated: iso(36),
      steps: ["识别需求 / 预算 / 决策阶段(BANT)", "匹配合适课程/套餐", "安排免费试听锁定意向", "高意向实时分配区域销售", "记录商机与跟进时间"] },
    { id: "sop_renew", scenario: "auto", mode: "outbound", title: "续保外呼 SOP", status: "on", pushCount: 9, updated: iso(18),
      steps: ["自报家门 + 说明来意(1 句内)", "确认车辆与到期信息", "给出老客折扣方案", "处理常见异议(比价/犹豫)", "引导确认或短信发送方案"] },
    { id: "sop_winback", scenario: "app", mode: "outbound", title: "流失召回 SOP", status: "on", pushCount: 6, updated: iso(28),
      steps: ["唤起近期使用记忆", "给出回归专属权益", "了解流失原因并记录", "引导一键回归/领取", "低意向礼貌收尾"] },
    { id: "sop_ymcs", scenario: "fintech", mode: "outbound", title: "订阅续费提醒 SOP", status: "on", pushCount: 11, updated: iso(6),
      steps: ["提醒到期时间与影响", "推荐匹配的增值套餐", "处理价格异议", "引导线上续费", "记录挽留结果"] },
    { id: "sop_csat", scenario: "*", mode: "outbound", title: "满意度回访 SOP", status: "on", pushCount: 5, updated: iso(50),
      steps: ["确认本人 + 说明回访", "1–10 分打分询问", "追问关键原因", "承接投诉转工单", "致谢收尾"] },
  ];

  // ---- Agent(编排:绑定 场景/模式/渠道/音色/知识库/话术)---------------------
  var agents = [
    { id: "ag_omni", name: "全渠道统一 AI 客服·销售", scenario: "ecom", mode: "omni",
      channel: ["voice", "web", "app", "miniapp", "wechat", "email", "sms", "whatsapp", "line"],
      voiceId: "v_lin", kbIds: ["kb_ecom_refund", "kb_ecom_ship", "kb_ecom_promo", "kb_app_pay", "kb_fin_repay", "kb_local_book", "kb_auto_renew", "kb_common_hours", "kb_common_privacy"],
      scriptId: "", status: "on", langs: ["zh", "yue", "en", "es", "ar", "th", "id"], model: "Realtime 2.0 · TTS/ASR",
      desc: "★ 一个 Agent 统一语音+文本全双工、全渠道(电话/网页/App/小程序/微信/邮件/短信/WhatsApp/LINE)、售前答疑+售后服务一体;一套知识库 · 一个 SenseAudio V2.0 模型",
      calls: 12840, resolveRate: 74, flagship: true },
    { id: "ag_ecom_svc", name: "跨境电商 · 售后客服", scenario: "ecom", mode: "service", channel: ["voice", "web", "whatsapp"], voiceId: "v_aria", kbIds: ["kb_ecom_refund", "kb_ecom_ship", "kb_ecom_promo"], scriptId: "sop_refund", status: "on", langs: ["en", "es", "ar", "id"], model: "Realtime 2.0", desc: "多语言售前售后,自动解答退换货/物流/优惠", calls: 3820, resolveRate: 71 },
    { id: "ag_ecom_sales", name: "跨境电商 · 导购销售", scenario: "ecom", mode: "sales", channel: ["web", "voice"], voiceId: "v_sales", kbIds: ["kb_ecom_promo"], scriptId: "sop_lead", status: "on", langs: ["en", "zh"], model: "Realtime 2.0", desc: "承接官网咨询转化,推荐型号与套餐", calls: 1240, resolveRate: 58 },
    { id: "ag_app_svc", name: "出海 App · 玩家支持", scenario: "app", mode: "service", channel: ["voice", "web", "line"], voiceId: "v_aria", kbIds: ["kb_app_pay", "kb_app_login"], scriptId: "sop_pay", status: "on", langs: ["en", "th", "vi", "id"], model: "Realtime 2.0", desc: "充值/登录/封号高频问题自助解决", calls: 5010, resolveRate: 76 },
    { id: "ag_app_winback", name: "出海 App · 流失召回外呼", scenario: "app", mode: "outbound", channel: ["voice"], voiceId: "v_promo", kbIds: [], scriptId: "sop_winback", status: "on", langs: ["en", "th"], model: "TTS 2.0 + Realtime", desc: "沉默用户回归专属权益触达", calls: 2600, resolveRate: 22 },
    { id: "ag_fin_svc", name: "金融科技 · 账户客服", scenario: "fintech", mode: "service", channel: ["voice", "web"], voiceId: "v_calm", kbIds: ["kb_fin_kyc", "kb_fin_repay", "kb_fin_risk"], scriptId: "sop_kyc", status: "on", langs: ["en", "zh", "ar"], model: "Realtime 2.0", desc: "账户/风控/KYC,强合规留痕", calls: 2980, resolveRate: 64 },
    { id: "ag_fin_ymcs", name: "金融科技 · 续费提醒外呼", scenario: "fintech", mode: "outbound", channel: ["voice"], voiceId: "v_calm", kbIds: ["kb_fin_repay"], scriptId: "sop_ymcs", status: "on", langs: ["zh", "en"], model: "TTS 2.0 + Realtime", desc: "账单/订阅到期主动提醒,降低漏续", calls: 3400, resolveRate: 31 },
    { id: "ag_local_book", name: "本地生活 · 预约助手", scenario: "local", mode: "service", channel: ["voice", "web", "wechat"], voiceId: "v_warm", kbIds: ["kb_local_book", "kb_local_course"], scriptId: "", status: "on", langs: ["zh", "yue", "en"], model: "Realtime 2.0", desc: "预约/改期/到店提醒/课程咨询", calls: 1760, resolveRate: 68 },
    { id: "ag_local_lead", name: "本地生活 · 课程销售", scenario: "local", mode: "sales", channel: ["voice", "wechat"], voiceId: "v_warm", kbIds: ["kb_local_course"], scriptId: "sop_lead", status: "on", langs: ["zh", "yue"], model: "Realtime 2.0", desc: "试听转化与线索资格审查", calls: 980, resolveRate: 44 },
    { id: "ag_auto_renew", name: "汽车保险 · 续保外呼", scenario: "auto", mode: "outbound", channel: ["voice"], voiceId: "v_sales", kbIds: ["kb_auto_renew"], scriptId: "sop_renew", status: "on", langs: ["zh", "yue"], model: "TTS 2.0 + Realtime", desc: "到期续保提醒 + 老客折扣", calls: 2210, resolveRate: 34 },
    { id: "ag_auto_claim", name: "汽车保险 · 理赔客服", scenario: "auto", mode: "service", channel: ["voice", "web"], voiceId: "v_calm", kbIds: ["kb_auto_claim", "kb_auto_renew"], scriptId: "", status: "off", langs: ["zh", "en"], model: "Realtime 2.0", desc: "出险报案/理赔进度/定损引导", calls: 640, resolveRate: 59 },
  ];

  // ---- 外呼任务(Outbound Campaign)------------------------------------------
  var campaigns = [
    { id: "cp_ymcs_q3", scenario: "fintech", name: "Q3 订阅续费提醒批次", voiceId: "v_calm", scriptId: "sop_ymcs", agentId: "ag_fin_ymcs", lang: "zh", listSize: 8600, done: 5120, connected: 3980, converted: 1210, status: "running", startTs: iso(72) },
    { id: "cp_renew_jul", scenario: "auto", name: "7 月车险续保触达", voiceId: "v_sales", scriptId: "sop_renew", agentId: "ag_auto_renew", lang: "zh", listSize: 4200, done: 4200, connected: 3010, converted: 1040, status: "done", startTs: iso(200) },
    { id: "cp_winback_th", scenario: "app", name: "泰国区流失用户召回", voiceId: "v_promo", scriptId: "sop_winback", agentId: "ag_app_winback", lang: "th", listSize: 12000, done: 3400, connected: 2180, converted: 470, status: "running", startTs: iso(48) },
    { id: "cp_csat_ecom", scenario: "ecom", name: "大促后满意度回访", voiceId: "v_aria", scriptId: "sop_csat", agentId: "", lang: "en", listSize: 3000, done: 0, connected: 0, converted: 0, status: "paused", startTs: iso(12) },
    { id: "cp_course_sep", scenario: "local", name: "秋季课程试听邀约", voiceId: "v_warm", scriptId: "sop_lead", agentId: "ag_local_lead", lang: "zh", listSize: 2600, done: 1180, connected: 890, converted: 260, status: "running", startTs: iso(30) },
    { id: "cp_kyc_remind", scenario: "fintech", name: "首提用户 KYC 提醒", voiceId: "v_calm", scriptId: "sop_kyc", agentId: "ag_fin_svc", lang: "en", listSize: 1500, done: 620, connected: 410, converted: 300, status: "running", startTs: iso(20) },
  ];

  // ---- 号码 / 线路 -----------------------------------------------------------
  var numbers = [
    { id: "n1", label: "中国大陆 · 主线", e164: "+86 400-889-****", region: "CN", channel: "voice", status: "on" },
    { id: "n2", label: "新加坡 · 东南亚出海", e164: "+65 3159 ****", region: "SG", channel: "voice", status: "on" },
    { id: "n3", label: "美国 · 北美线路", e164: "+1 415 555 ****", region: "US", channel: "voice", status: "on" },
    { id: "n4", label: "阿联酋 · 中东线路", e164: "+971 4 ***  ****", region: "AE", channel: "voice", status: "on" },
    { id: "n5", label: "WhatsApp Business", e164: "wa: +65 8••• ••••", region: "GLOBAL", channel: "whatsapp", status: "on" },
    { id: "n6", label: "泰国 · 本地号", e164: "+66 2 *** ****", region: "TH", channel: "voice", status: "off" },
  ];

  // ---- SenseAudio V2.0 模型矩阵 + 公开基准(引自《SenseAudio V2.0 介绍》)----
  var model = {
    name: "SenseAudio V2.0", vendor: "商汤科技 SenseTime", defaultVoice: "v_lin",
    langCount: 30, extraLang: "粤语",
    matrix: [
      { id: "tts", name: "TTS V2.0 语音合成", io: "文字 → 语音", langs: "30 语言 + 粤语", highlight: "零样本音色克隆(5–30 秒参考音频)、流式低延迟输出", status: "ready" },
      { id: "vc", name: "VC 2.0 变声器", io: "语音 → 语音", langs: "中文 / 英文", highlight: "内容节奏不变仅替换音色,用于坐席脱敏与品牌音色统一", status: "ready" },
      { id: "rt", name: "Realtime 2.0 端到端", io: "语音 → 语音", langs: "多语种对话", highlight: "直进直出、可打断可插话、保留语气情绪、低延迟(全双工)", status: "ready" },
      { id: "asr", name: "ASR 听写", io: "语音 → 文字", langs: "多语种", highlight: "质检 / 合规留痕 / CRM 结构化写入 / 报表分析的文本中间态", status: "ready" },
    ],
    benchmarks: {
      sim24: [ { sys: "声渡 VoxOne (V2.0)", v: 82.0, self: true }, { sys: "Fish Audio S2-Pro", v: 78.0 }, { sys: "MiniMax-Speech", v: 76.6 }, { sys: "ElevenLabs v2", v: 65.5 } ],
      seedtts: [ { sys: "声渡 VoxOne (V2.0)", cer: 0.98, wer: 1.59, self: true }, { sys: "Seed-TTS", cer: 1.12, wer: 2.25 }, { sys: "F5-TTS", cer: 1.53, wer: 2.00 }, { sys: "CosyVoice3-0.5B", cer: 1.16, wer: 2.02 } ],
      vc: [ { sys: "声渡 VoxOne VC 2.0", wer: 3.78, ss: 0.78, self: true }, { sys: "ElevenLabs", wer: 4.5, ss: 0.74 }, { sys: "Vevo", wer: 7.55, ss: 0.76 }, { sys: "Seed-VC", wer: 32.20, ss: 0.75 } ],
      extra: [ { k: "中文 CER", v: "0.98" }, { k: "英文 WER", v: "1.59" }, { k: "泰语 WER", v: "1.67" }, { k: "土耳其 WER", v: "0.57" }, { k: "变声 SS", v: "0.78" }, { k: "变声 WER", v: "3.78" } ],
    },
    pricing: [
      { sys: "Vapi", mode: "多段分计·最多5张账单", cost: "$0.13–0.31+", stack: "第三方拼装" },
      { sys: "Retell AI", mode: "按量 / BYOK·透明", cost: "$0.11–0.15", stack: "第三方 / BYOK" },
      { sys: "Synthflow", mode: "语音 $0.09 + LLM", cost: "$0.11–0.24", stack: "第三方拼装" },
      { sys: "PolyAI", mode: "企业年合同", cost: "≈$150k/年起", stack: "自研对话 + 他" },
      { sys: "声渡 VoxOne", mode: "自研全栈一口价", cost: "$0.06–0.09", stack: "全栈自研", self: true },
    ],
  };

  // ---- 统一 Agent 管理平台 · 对接(展示态默认值)-----------------------------
  var integration = { hubName: "统一 Agent 管理平台", connected: false, lastSync: "", exposedCount: 0 };

  // ---- 概览指标(今日快照 + 7 日趋势)---------------------------------------
  var metrics = {
    today: { calls: 4218, aiResolveRate: 68.5, transferRate: 12.4, avgLatencyMs: 320, avgCsat: 4.6, langsActive: 18, concurrentPeak: 240, costSavedRMB: 38600 },
    targets: { aiResolveRate: 70, avgLatencyMs: 350, avgCsat: 4.5 },
    trend7: [
      { d: "07-10", calls: 3620, ai: 65.2, csat: 4.4 }, { d: "07-11", calls: 3880, ai: 66.1, csat: 4.5 },
      { d: "07-12", calls: 3410, ai: 67.0, csat: 4.5 }, { d: "07-13", calls: 3990, ai: 66.8, csat: 4.6 },
      { d: "07-14", calls: 4120, ai: 67.9, csat: 4.6 }, { d: "07-15", calls: 4360, ai: 68.2, csat: 4.6 },
      { d: "07-16", calls: 4218, ai: 68.5, csat: 4.6 },
    ],
    channels: [
      { k: "电话语音", v: 41 }, { k: "网页/App", v: 22 }, { k: "WhatsApp", v: 14 }, { k: "微信", v: 9 }, { k: "LINE", v: 7 }, { k: "邮件/短信", v: 7 },
    ],
  };

  var data = { metrics: metrics, agents: agents, knowledge: knowledge, scripts: scripts, voices: voices, campaigns: campaigns, numbers: numbers, model: model, integration: integration };

  // ---- 会话留痕演示样本 ------------------------------------------------------
  var calls = [
    // —— 全渠道统一 Agent:同一个 Agent、同一套知识库,跨渠道 + 售前售后 ——
    { ts: iso(0.3), scenario: "ecom", mode: "omni", channel: "email", lang: "en", agentId: "ag_omni", agentName: "全渠道统一 AI 客服·销售", voiceId: "v_lin", voiceName: "林向晚 · 品牌主音色", actor: "seat_en", actorName: "Aisha", customer: "邮件 · 德国客户", intent: "退换货政策与流程", outcome: "AI 自助解决(售后)", resolvedBy: "ai", durationSec: 0, turns: 3, csat: 5, qaScore: 95, latencyMs: 0, bargeIn: false, sopId: "sop_refund", sopTitle: "退换货 SOP",
      transcript: [ { role: "user", text: "Hi, I received the wrong size, how do I return it?" }, { role: "ai", text: "Sorry about that! You can return within 15 days — I've attached a prepaid label; refund lands in 3–5 business days after inspection." }, { role: "user", text: "Thanks!" } ], tags: ["全渠道", "售后", "邮件文本"] },
    { ts: iso(0.6), scenario: "ecom", mode: "omni", channel: "wechat", lang: "zh", agentId: "ag_omni", agentName: "全渠道统一 AI 客服·销售", voiceId: "v_lin", voiceName: "林向晚 · 品牌主音色", actor: "seat_zh", actorName: "林向晚", customer: "微信 · 深圳客户", intent: "优惠券与满减", outcome: "售前促成下单", resolvedBy: "ai", durationSec: 0, turns: 4, csat: 5, qaScore: 92, latencyMs: 0, bargeIn: false, sopId: "", sopTitle: "",
      transcript: [ { role: "user", text: "这款有活动吗?" }, { role: "ai", text: "有的,当前跨店满 300 减 40,结算页可叠加平台券,建议尽快下单更划算。" }, { role: "user", text: "好,那我下单了" }, { role: "ai", text: "已为您锁定优惠,有任何售后问题也可以随时找我。" } ], tags: ["全渠道", "售前", "微信文本"] },
    { ts: iso(0.9), scenario: "app", mode: "omni", channel: "miniapp", lang: "zh", agentId: "ag_omni", agentName: "全渠道统一 AI 客服·销售", voiceId: "v_lin", voiceName: "林向晚 · 品牌主音色", actor: "seat_zh", actorName: "林向晚", customer: "小程序 · 上海用户", intent: "充值未到账 / 内购问题", outcome: "AI 自助解决(售后)", resolvedBy: "ai", durationSec: 0, turns: 4, csat: 4, qaScore: 90, latencyMs: 0, bargeIn: false, sopId: "sop_pay", sopTitle: "支付核验 SOP",
      transcript: [ { role: "user", text: "充值没到账" }, { role: "ai", text: "别着急,请提供订单号与充值时间,我为您核验支付回执。" }, { role: "user", text: "TX-88021,刚刚" }, { role: "ai", text: "已确认扣款成功,正在为您补发并附赠补偿,请稍候查收。" } ], tags: ["全渠道", "售后", "小程序文本"] },
    { ts: iso(1.2), scenario: "auto", mode: "omni", channel: "voice", lang: "zh", agentId: "ag_omni", agentName: "全渠道统一 AI 客服·销售", voiceId: "v_lin", voiceName: "林向晚 · 品牌主音色", actor: "seat_zh", actorName: "林向晚", customer: "电话 · 杭州车主", intent: "续保 / 保单查询", outcome: "售前咨询→售后一体", resolvedBy: "ai", durationSec: 118, turns: 5, csat: 5, qaScore: 93, latencyMs: 300, bargeIn: true, sopId: "", sopTitle: "",
      transcript: [ { role: "user", text: "我想问下续保,顺便查下上次理赔" }, { role: "ai", text: "好的,您的车险本月底到期,老客续保可享折扣;上次理赔已结案。要我把续保方案发您确认吗?" }, { role: "user", text: "行" }, { role: "ai", text: "方案已短信发送,售后有问题随时找我。" } ], tags: ["全渠道", "售前+售后", "电话语音全双工"] },
    { ts: iso(1.5), scenario: "fintech", mode: "omni", channel: "web", lang: "en", agentId: "ag_omni", agentName: "全渠道统一 AI 客服·销售", voiceId: "v_lin", voiceName: "林向晚 · 品牌主音色", actor: "seat_en", actorName: "Aisha", customer: "网页 · 印尼用户", intent: "还款 / 续费提醒", outcome: "AI 自助完成(售后)", resolvedBy: "ai", durationSec: 0, turns: 3, csat: 4, qaScore: 89, latencyMs: 0, bargeIn: false, sopId: "", sopTitle: "",
      transcript: [ { role: "user", text: "When is my bill due?" }, { role: "ai", text: "Your bill is due in 3 days — you can repay in one tap under 'My Bills', and I can set up an installment plan if needed." }, { role: "user", text: "ok thanks" } ], tags: ["全渠道", "售后", "网页文本"] },
    { ts: iso(1), scenario: "ecom", mode: "service", channel: "whatsapp", lang: "en", agentId: "ag_ecom_svc", agentName: "跨境电商 · 售后客服", voiceId: "v_aria", voiceName: "Aria · 国际女声", actor: "seat_en", actorName: "Aisha", customer: "Order #A83291 · 印尼", intent: "退换货政策与流程", outcome: "AI 自助解决 · 生成退货面单", resolvedBy: "ai", durationSec: 132, turns: 5, csat: 5, qaScore: 96, latencyMs: 300, bargeIn: true, sopId: "sop_refund", sopTitle: "退换货 SOP",
      transcript: [ { role: "user", text: "The shoes don't fit, can I return them?" }, { role: "ai", text: "Sorry about the fit! You can return within 15 days of delivery — I'll generate a prepaid label now." }, { role: "user", text: "Great, how long for the refund?" }, { role: "ai", text: "Refund goes back to your original method within 3–5 business days after inspection." }, { role: "user", text: "Perfect, thank you." } ], tags: ["自助解决", "情绪正向"] },
    { ts: iso(2), scenario: "fintech", mode: "service", channel: "voice", lang: "en", agentId: "ag_fin_svc", agentName: "金融科技 · 账户客服", voiceId: "v_calm", voiceName: "沉稳男声 · 顾维", actor: "seat_en", actorName: "Aisha", customer: "+971 50 *** 涉中东", intent: "身份核验 / KYC", outcome: "引导完成 KYC · 额度恢复", resolvedBy: "ai", durationSec: 205, turns: 6, csat: 4, qaScore: 92, latencyMs: 330, bargeIn: true, sopId: "sop_kyc", sopTitle: "KYC 合规核验 SOP",
      transcript: [ { role: "user", text: "لماذا لا أستطيع السحب؟" }, { role: "ai", text: "[AR] 为保障资金安全,首次提现需完成身份核验,我来一步步引导您。" }, { role: "user", text: "حسنًا" }, { role: "ai", text: "请上传证件正反面与本人手持照,全程加密留痕。" } ], tags: ["合规留痕", "多语言"] },
    { ts: iso(3), scenario: "app", mode: "service", channel: "line", lang: "th", agentId: "ag_app_svc", agentName: "出海 App · 玩家支持", voiceId: "v_aria", voiceName: "Aria · 国际女声", actor: "seat_en", actorName: "Aisha", customer: "LINE 用户 · 泰国", intent: "充值未到账 / 内购问题", outcome: "核验成功 · 即时补发 + 补偿", resolvedBy: "ai", durationSec: 168, turns: 5, csat: 5, qaScore: 94, latencyMs: 310, bargeIn: false, sopId: "sop_pay", sopTitle: "支付核验 SOP",
      transcript: [ { role: "user", text: "เติมเงินแล้วไม่เข้า" }, { role: "ai", text: "[TH] 别着急,请提供订单号与充值时间,我为您核验支付回执。" }, { role: "user", text: "TX-77120, เมื่อกี้" }, { role: "ai", text: "已确认扣款成功,正在为您补发并附赠补偿,请查收。" } ], tags: ["自助解决"] },
    { ts: iso(4), scenario: "auto", mode: "outbound", channel: "voice", lang: "zh", agentId: "ag_auto_renew", agentName: "汽车保险 · 续保外呼", voiceId: "v_sales", voiceName: "金牌销售 · 陈锐", actor: "ops", actorName: "周莹", customer: "沪 A·车主王先生", intent: "续保 / 保单查询", outcome: "同意续保 · 短信发送方案", resolvedBy: "ai", durationSec: 96, turns: 4, csat: 5, qaScore: 90, latencyMs: 290, bargeIn: true, sopId: "sop_renew", sopTitle: "续保外呼 SOP",
      transcript: [ { role: "ai", text: "王先生您好,您的车险本月底到期,老客户续保可享折扣。" }, { role: "user", text: "能便宜多少?" }, { role: "ai", text: "保障与去年一致,保费更优,我把方案短信发您确认好吗?" }, { role: "user", text: "行,发吧。" } ], tags: ["外呼转化", "老客折扣"] },
    { ts: iso(5), scenario: "ecom", mode: "sales", channel: "web", lang: "en", agentId: "ag_ecom_sales", agentName: "跨境电商 · 导购销售", voiceId: "v_sales", voiceName: "金牌销售 · 陈锐", actor: "seat_en", actorName: "Aisha", customer: "官网访客 · 美国", intent: "优惠券与满减", outcome: "高意向 · 已转区域销售", resolvedBy: "human", durationSec: 240, turns: 7, csat: 4, qaScore: 88, latencyMs: 340, bargeIn: true, sopId: "sop_lead", sopTitle: "线索资格审查 SOP",
      transcript: [ { role: "user", text: "Do you have bulk discounts?" }, { role: "ai", text: "Yes — there's a cross-store 300−40 promo, and for bulk I can loop in our regional sales for a custom quote." }, { role: "user", text: "We need 500 units." }, { role: "ai", text: "High-intent lead — connecting you to a human sales rep with full context now." } ], tags: ["高意向线索", "转人工"] },
    { ts: iso(6), scenario: "fintech", mode: "outbound", channel: "voice", lang: "zh", agentId: "ag_fin_ymcs", agentName: "金融科技 · 续费提醒外呼", voiceId: "v_calm", voiceName: "沉稳男声 · 顾维", actor: "ops", actorName: "周莹", customer: "订阅用户 · 深圳", intent: "还款 / 续费提醒", outcome: "线上续费成功", resolvedBy: "ai", durationSec: 88, turns: 4, csat: 4, qaScore: 91, latencyMs: 305, bargeIn: true, sopId: "sop_ymcs", sopTitle: "订阅续费提醒 SOP",
      transcript: [ { role: "ai", text: "您好,您的订阅将于 3 日后到期,续费可继续享受当前权益。" }, { role: "user", text: "怎么续?" }, { role: "ai", text: "在 App「我的账单」一键续费即可,我已为您保留了优惠价。" } ], tags: ["漏续挽回"] },
    { ts: iso(7), scenario: "local", mode: "service", channel: "wechat", lang: "yue", agentId: "ag_local_book", agentName: "本地生活 · 预约助手", voiceId: "v_warm", voiceName: "暖心女声 · 苏念", actor: "seat_zh", actorName: "林向晚", customer: "微信用户 · 广州", intent: "预约与到店提醒", outcome: "改期成功 · 已发提醒", resolvedBy: "ai", durationSec: 74, turns: 4, csat: 5, qaScore: 95, latencyMs: 280, bargeIn: false, sopId: "", sopTitle: "",
      transcript: [ { role: "user", text: "想改下周三个预约" }, { role: "ai", text: "冇问题,已帮您查到预约,改到下周三边个时间点方便?" }, { role: "user", text: "下午三点" }, { role: "ai", text: "已改到周三下午三点,到店提醒同预约码稍后微信发您。" } ], tags: ["粤语", "自助解决"] },
    { ts: iso(9), scenario: "app", mode: "outbound", channel: "voice", lang: "th", agentId: "ag_app_winback", agentName: "出海 App · 流失召回外呼", voiceId: "v_promo", voiceName: "活力女声 · 小渡", actor: "ops", actorName: "周莹", customer: "沉默用户 · 曼谷", intent: "流失召回", outcome: "领取回归权益", resolvedBy: "ai", durationSec: 63, turns: 3, csat: 4, qaScore: 86, latencyMs: 315, bargeIn: true, sopId: "sop_winback", sopTitle: "流失召回 SOP",
      transcript: [ { role: "ai", text: "[TH] 好久不见,给您准备了回归专属权益。" }, { role: "user", text: "มีอะไรบ้าง" }, { role: "ai", text: "登录即领 7 天会员 + 新手礼包,帮您一键激活好吗?" } ], tags: ["召回"] },
    { ts: iso(11), scenario: "auto", mode: "service", channel: "voice", lang: "zh", agentId: "ag_auto_claim", agentName: "汽车保险 · 理赔客服", voiceId: "v_calm", voiceName: "沉稳男声 · 顾维", actor: "seat_zh", actorName: "林向晚", customer: "车主 · 杭州", intent: "出险与理赔流程", outcome: "在线报案 · 生成案件号", resolvedBy: "ai", durationSec: 156, turns: 5, csat: 4, qaScore: 89, latencyMs: 300, bargeIn: true, sopId: "", sopTitle: "",
      transcript: [ { role: "user", text: "刚出了点小事故" }, { role: "ai", text: "先确保安全并拍照取证,我为您在线报案。" }, { role: "user", text: "好的" }, { role: "ai", text: "案件号已生成,查勘定损 24 小时内联系您,小额可走线上快赔。" } ], tags: ["理赔", "自助解决"] },
    { ts: iso(13), scenario: "ecom", mode: "service", channel: "voice", lang: "en", agentId: "ag_ecom_svc", agentName: "跨境电商 · 售后客服", voiceId: "v_aria", voiceName: "Aria · 国际女声", actor: "seat_en", actorName: "Aisha", customer: "愤怒客户 · 英国", intent: "物流与配送时效", outcome: "情绪安抚后转人工", resolvedBy: "human", durationSec: 220, turns: 6, csat: 3, qaScore: 84, latencyMs: 350, bargeIn: true, sopId: "", sopTitle: "",
      transcript: [ { role: "user", text: "This is terrible, where is my order?!" }, { role: "ai", text: "I'm sorry for the trouble — I'll prioritize this. Cross-border orders take 7–12 days; let me open a trace ticket." }, { role: "user", text: "I want a human." }, { role: "ai", text: "Connecting you to a human agent now with full context." } ], tags: ["负向情绪", "转人工"] },
    { ts: iso(15), scenario: "local", mode: "sales", channel: "wechat", lang: "zh", agentId: "ag_local_lead", agentName: "本地生活 · 课程销售", voiceId: "v_warm", voiceName: "暖心女声 · 苏念", actor: "seat_zh", actorName: "林向晚", customer: "家长 · 成都", intent: "课程咨询与试听", outcome: "预约试听 · 高意向", resolvedBy: "ai", durationSec: 190, turns: 6, csat: 5, qaScore: 93, latencyMs: 295, bargeIn: false, sopId: "sop_lead", sopTitle: "线索资格审查 SOP",
      transcript: [ { role: "user", text: "孩子三年级,想补数学" }, { role: "ai", text: "了解,给您推荐小学进阶班,先安排一次免费试听好吗?" }, { role: "user", text: "可以" }, { role: "ai", text: "已锁定早鸟优惠并预约试听,稍后微信发您时间。" } ], tags: ["高意向线索"] },
    { ts: iso(18), scenario: "fintech", mode: "service", channel: "web", lang: "en", agentId: "ag_fin_svc", agentName: "金融科技 · 账户客服", voiceId: "v_calm", voiceName: "沉稳男声 · 顾维", actor: "qa", actorName: "薛佳欣", customer: "网页用户 · 尼日利亚", intent: "交易风控 / 冻结", outcome: "核验解除限制", resolvedBy: "ai", durationSec: 142, turns: 5, csat: 4, qaScore: 90, latencyMs: 325, bargeIn: false, sopId: "sop_kyc", sopTitle: "KYC 合规核验 SOP",
      transcript: [ { role: "user", text: "My account is frozen." }, { role: "ai", text: "The system temporarily protected your account after an unusual transaction. A quick identity check will lift it." }, { role: "user", text: "ok let's do it" }, { role: "ai", text: "Once verified, normal transactions resume instantly." } ], tags: ["风控", "合规"] },
  ];

  w.VX_SEED = { data: data, calls: calls };
})(typeof window !== "undefined" ? window : this);
