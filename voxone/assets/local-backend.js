/* ============================================================================
 *  声渡 VoxOne · 本地后端(静态模式 / Static Mode)
 *
 *  作用:在**没有 Node 服务端**的情况下(直接双击 .html 用 file:// 打开,或把
 *  整个目录丢到任意静态托管),把 server/ 那套 API 完整地在浏览器里实现一遍,
 *  让 14 个页面 + 嵌入式 widget 全部可点、可改、可留痕。
 *
 *  数据源与服务端**同一份** assets/seed.js;状态存 localStorage(vx_static_db),
 *  刷新不丢,可在「系统设置 → 重置演示数据」还原。
 *
 *  ⚠️ 安全边界(务必知悉):静态模式没有服务端,所谓「登录 / RBAC / 越权 403」
 *     全部在浏览器里跑 —— 它只保证**演示行为与服务端一致**,不构成任何真实的
 *     安全隔离(密码明文存 localStorage、token 不做签名校验)。要真实鉴权、
 *     真实 SQLite 留痕、跨端共享数据,请用 `./start.sh` 起 Node 服务端。
 *
 *  端口:window.VXLOCAL = { request(path, method, body, token) -> {status,data},
 *                          gateway(kind, body), gwToken(), active }
 * ========================================================================== */
(function (w) {
  "use strict";
  if (!w || !w.VX_SEED) { console.error("[VoxOne] local-backend 需要先加载 assets/seed.js"); return; }

  var LS_KEY = "vx_static_db";
  var DEFAULT_PW = "voxone@2026";
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var nowIso = function () { return new Date().toISOString(); };

  /* ---------- RBAC(与 server/auth.js 保持一致)-------------------------- */
  var SCENARIOS = [
    { id: "ecom",    name: "跨境电商 / 零售",     emoji: "🛒", langs: "英/西/阿/东南亚" },
    { id: "app",     name: "出海 App / 游戏",     emoji: "🎮", langs: "多语种" },
    { id: "fintech", name: "金融科技 / 跨境支付", emoji: "💳", langs: "多语种(强合规)" },
    { id: "local",   name: "本地生活 / 教育",     emoji: "🏫", langs: "中/粤/英" },
    { id: "auto",    name: "汽车 / 保险",         emoji: "🚗", langs: "中/粤/多语种" },
  ];
  var PAGES_ALL = ["index", "omni", "workbench", "service", "sales", "outbound", "agents",
    "knowledge", "voices", "traces", "model", "integration", "users", "settings"];
  var PERMS = {
    superadmin: {
      label: "平台管理员", pages: PAGES_ALL,
      manageUsers: true, manageAgents: true, editConfig: true, runOutbound: true,
      useWorkbench: true, qa: true, manageModel: true, manageIntegration: true, viewAll: true,
    },
    ops_admin: {
      label: "运营管理员", pages: ["index", "omni", "workbench", "service", "sales", "outbound", "agents", "knowledge", "voices", "traces", "integration", "settings"],
      manageUsers: false, manageAgents: true, editConfig: true, runOutbound: true,
      useWorkbench: true, qa: true, manageModel: false, manageIntegration: true, viewAll: true,
    },
    team_lead: {
      label: "坐席主管", pages: ["index", "omni", "workbench", "service", "sales", "outbound", "agents", "knowledge", "voices", "traces", "settings"],
      manageUsers: false, manageAgents: true, editConfig: true, runOutbound: true,
      useWorkbench: true, qa: true, manageModel: false, manageIntegration: false, viewAll: false,
    },
    agent: {
      label: "坐席 / 一线", pages: ["index", "omni", "workbench", "service", "sales", "outbound", "traces", "settings"],
      manageUsers: false, manageAgents: false, editConfig: false, runOutbound: false,
      useWorkbench: true, qa: false, manageModel: false, manageIntegration: false, viewAll: false,
    },
    analyst: {
      label: "质检 / 分析", pages: ["index", "omni", "service", "sales", "outbound", "traces", "settings"],
      manageUsers: false, manageAgents: false, editConfig: false, runOutbound: false,
      useWorkbench: false, qa: true, manageModel: false, manageIntegration: false, viewAll: true,
    },
    viewer: {
      label: "观察员", pages: ["index", "omni", "service", "sales", "outbound", "agents", "knowledge", "voices", "traces", "integration", "settings"],
      manageUsers: false, manageAgents: false, editConfig: false, runOutbound: false,
      useWorkbench: false, qa: false, manageModel: false, manageIntegration: false, viewAll: true,
    },
  };
  var permsFor = function (role) { return PERMS[role] || PERMS.agent; };
  var inScenario = function (arr, sc) { arr = Array.isArray(arr) ? arr : []; return arr.indexOf("*") >= 0 || arr.indexOf(sc) >= 0; };

  //        username     role          scenarios          name       title
  var USER_SEED = [
    ["admin",     "superadmin", ["*"],              "韩启微", "平台管理员 · 大模型生态渠道部"],
    ["ops",       "ops_admin",  ["*"],              "周莹",   "运营管理员 · 客户成功"],
    ["lead_ecom", "team_lead",  ["ecom"],           "蒋磊",   "跨境电商坐席主管"],
    ["lead_fin",  "team_lead",  ["fintech"],        "郭强健", "金融科技坐席主管"],
    ["seat_en",   "agent",      ["ecom", "app"],    "Aisha",  "多语言坐席 · EN/AR/ID"],
    ["seat_zh",   "agent",      ["local", "auto"],  "林向晚", "中文/粤语坐席"],
    ["qa",        "analyst",    ["*"],              "薛佳欣", "会话质检 / 分析"],
    ["viewer",    "viewer",     ["*"],              "访客",   "观察员"],
  ];

  /* ---------- 存储层(localStorage 代替 SQLite)-------------------------- */
  var DB = null;

  function freshDB() {
    var d = {
      ver: 1,
      data: clone(w.VX_SEED.data),
      users: USER_SEED.map(function (r) {
        return { username: r[0], pass: DEFAULT_PW, role: r[1], scenarios: r[2].slice(), name: r[3], title: r[4], mustChange: 0 };
      }),
      calls: [], nextCallId: 1, audit: [], integ: [],
      meta: { gw_token: "vx_" + rndHex(18) },
    };
    (w.VX_SEED.calls || []).forEach(function (c) { pushCall(d, c); });
    return d;
  }
  function rndHex(n) {
    var b = new Uint8Array(n);
    (w.crypto || {}).getRandomValues ? w.crypto.getRandomValues(b) : b.forEach(function (_, i) { b[i] = (i * 37 + 11) % 256; });
    return Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }
  function load() {
    if (DB) return DB;
    try {
      var raw = w.localStorage.getItem(LS_KEY);
      if (raw) { DB = JSON.parse(raw); if (DB && DB.data && DB.users) return DB; }
    } catch (e) { /* 存储不可用(隐私模式)→ 退回内存态,页面仍可用 */ }
    DB = freshDB(); save();
    return DB;
  }
  function save() { try { w.localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {} }

  var getMeta = function (k, def) { var v = load().meta[k]; return v == null ? (def === undefined ? null : def) : v; };
  var setMeta = function (k, v) { load().meta[k] = String(v); save(); };

  function logAudit(actor, action, detail) {
    var d = load();
    d.audit.unshift({ ts: nowIso(), actor: actor || "?", action: action || "", detail: detail || "" });
    d.audit = d.audit.slice(0, 500); save();
  }
  function logInteg(kind, target, ok, detail) {
    var d = load();
    d.integ.unshift({ ts: nowIso(), kind: kind || "", target: target || "", ok: !!ok, detail: detail || "" });
    d.integ = d.integ.slice(0, 200); save();
  }

  /* ---------- 会话留痕(等价 db.js calls 表)------------------------------ */
  function pushCall(d, c) {
    var row = {
      id: d.nextCallId++,
      ts: c.ts || nowIso(),
      scenario: c.scenario || "", mode: c.mode || "service", channel: c.channel || "voice", lang: c.lang || "zh",
      agentId: c.agentId || "", agentName: c.agentName || "", voiceId: c.voiceId || "", voiceName: c.voiceName || "",
      actor: c.actor || "", actorName: c.actorName || "", customer: c.customer || "",
      intent: c.intent || "", outcome: c.outcome || "", resolvedBy: c.resolvedBy || "ai",
      durationSec: Number(c.durationSec || 0), turns: Number(c.turns || 0),
      csat: c.csat == null ? null : Number(c.csat), qaScore: c.qaScore == null ? null : Number(c.qaScore),
      latencyMs: Number(c.latencyMs || 0), bargeIn: !!c.bargeIn,
      sopId: c.sopId || "", sopTitle: c.sopTitle || "",
      transcript: c.transcript || [], tags: c.tags || [],
    };
    d.calls.push(row);
    return row.id;
  }
  function insertCall(c) { var d = load(); var id = pushCall(d, c); save(); return id; }
  function updateCallQA(id, qaScore, tags) {
    var d = load(), r = d.calls.filter(function (x) { return x.id === Number(id); })[0];
    if (r) { r.qaScore = Number(qaScore); r.tags = tags || []; save(); }
  }
  function listCalls(o) {
    o = o || {};
    var limit = Number(o.limit) || 200;
    var q = o.q ? String(o.q).toLowerCase() : "";
    var rows = load().calls.filter(function (c) {
      if (o.scenario && o.scenario !== "*" && c.scenario !== o.scenario) return false;
      if (o.mode && c.mode !== o.mode) return false;
      if (o.channel && c.channel !== o.channel) return false;
      if (o.agentId && c.agentId !== o.agentId) return false;
      if (o.resolvedBy && c.resolvedBy !== o.resolvedBy) return false;
      if (q) {
        // 与 SQL 版一致:intent / customer / transcript / actorName / outcome 五列模糊匹配
        var hay = [c.intent, c.customer, JSON.stringify(c.transcript || []), c.actorName, c.outcome].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    return rows.sort(function (a, b) { return b.id - a.id; }).slice(0, limit).map(clone);
  }
  function getCall(id) { var r = load().calls.filter(function (x) { return x.id === Number(id); })[0]; return r ? clone(r) : null; }

  function callStats(scenarioFilter) {
    var all = listCalls({ scenario: scenarioFilter, limit: 100000 });
    var s = { total: all.length, aiResolved: 0, transferred: 0, byScene: {}, byMode: {}, byChannel: {}, byLang: {},
      sumDur: 0, sumLat: 0, csatN: 0, csatSum: 0, qaN: 0, qaSum: 0, bargeIn: 0 };
    all.forEach(function (c) {
      if (c.resolvedBy === "ai") s.aiResolved++; else if (c.resolvedBy === "human") s.transferred++;
      s.byScene[c.scenario] = (s.byScene[c.scenario] || 0) + 1;
      s.byMode[c.mode] = (s.byMode[c.mode] || 0) + 1;
      s.byChannel[c.channel] = (s.byChannel[c.channel] || 0) + 1;
      s.byLang[c.lang] = (s.byLang[c.lang] || 0) + 1;
      s.sumDur += c.durationSec || 0; s.sumLat += c.latencyMs || 0;
      if (c.csat != null) { s.csatN++; s.csatSum += c.csat; }
      if (c.qaScore != null) { s.qaN++; s.qaSum += c.qaScore; }
      if (c.bargeIn) s.bargeIn++;
    });
    return {
      total: s.total, aiResolved: s.aiResolved, transferred: s.transferred,
      aiResolveRate: s.total ? Math.round((s.aiResolved / s.total) * 1000) / 10 : 0,
      avgDurationSec: s.total ? Math.round(s.sumDur / s.total) : 0,
      avgLatencyMs: s.total ? Math.round(s.sumLat / s.total) : 0,
      avgCsat: s.csatN ? Math.round((s.csatSum / s.csatN) * 10) / 10 : 0,
      avgQa: s.qaN ? Math.round(s.qaSum / s.qaN) : 0,
      bargeIn: s.bargeIn,
      byScene: s.byScene, byMode: s.byMode, byChannel: s.byChannel, byLang: s.byLang,
    };
  }

  /* ---------- SenseAudio 接入层(等价 server/realtime.js)----------------- */
  var MK = {
    endpoint: "sa_endpoint", apiKey: "sa_apikey", realtimeModel: "sa_rt_model",
    chatPath: "sa_chat_path", chatModel: "sa_chat_model",
    ttsModel: "sa_tts_model", ttsPath: "sa_tts_path", ttsVoice: "sa_tts_voice", ttsFormat: "sa_tts_format",
    asrModel: "sa_asr_model", asrPath: "sa_asr_path",
  };
  function modelConfig() {
    var cfg = load().data.model || {};
    var endpoint = getMeta(MK.endpoint, "");
    var apiKey = getMeta(MK.apiKey, "");
    var out = clone(cfg);
    out.endpoint = endpoint;
    out.chatPath = getMeta(MK.chatPath, "/chat/completions");
    out.chatModel = getMeta(MK.chatModel, "deepseek-v4-flash");
    out.realtimeModel = getMeta(MK.realtimeModel, "SenseAudio-Realtime-2.0");
    out.ttsModel = getMeta(MK.ttsModel, "senseaudio-tts-1.5-260319");
    out.ttsPath = getMeta(MK.ttsPath, "/audio/speech");
    out.ttsVoice = getMeta(MK.ttsVoice, "default");
    out.ttsFormat = getMeta(MK.ttsFormat, "mp3");
    out.asrModel = getMeta(MK.asrModel, "senseaudio-asr-1.5-260319");
    out.asrPath = getMeta(MK.asrPath, "/audio/transcriptions");
    out.apiKeySet = !!apiKey;
    out.apiKeyMask = apiKey ? apiKey.slice(0, 4) + "••••••••" + apiKey.slice(-2) : "";
    out.mode = (endpoint && apiKey) ? "live" : "builtin";
    out.staticMode = true; // 供前端提示:当前无服务端,live 直连受浏览器跨域策略限制
    return out;
  }
  function setModelCreds(b) {
    var put = function (k, v, allowEmpty) { if (v != null && (allowEmpty || v !== "")) setMeta(k, v); };
    put(MK.endpoint, b.endpoint, true);
    put(MK.apiKey, b.apiKey); put(MK.realtimeModel, b.realtimeModel);
    put(MK.chatPath, b.chatPath); put(MK.chatModel, b.chatModel);
    put(MK.ttsModel, b.ttsModel); put(MK.ttsPath, b.ttsPath); put(MK.ttsVoice, b.ttsVoice); put(MK.ttsFormat, b.ttsFormat);
    put(MK.asrModel, b.asrModel); put(MK.asrPath, b.asrPath);
  }
  function voiceCaps() {
    var cfg = modelConfig(), live = cfg.mode === "live";
    return {
      mode: cfg.mode, serverVoice: live, tts: live, asr: live,
      provider: live ? "SenseAudio V2.0" : "browser",
      ttsModel: cfg.ttsModel, asrModel: cfg.asrModel,
      note: live
        ? "已填写 SenseAudio 端点:静态模式下由浏览器直连,能否成功取决于端点的 CORS 策略;失败自动回退浏览器语音。"
        : "静态模式 · 使用浏览器本地语音(Web Speech);要接真实 SenseAudio 语音请起 Node 服务端。",
    };
  }

  var NEG = ["投诉", "差评", "太差", "生气", "垃圾", "骗", "起诉", "曝光", "complaint", "angry", "terrible", "sue", "worst", "rubbish"];
  var HANDOFF = ["人工", "转人工", "真人", "客服经理", "human", "agent", "representative", "real person"];
  function detectLang(text) {
    if (/[一-鿿]/.test(text)) return "zh";
    if (/[؀-ۿ]/.test(text)) return "ar";
    if (/[฀-๛]/.test(text)) return "th";
    return "en";
  }
  function retrieve(data, scenario, text) {
    var t = String(text || "").toLowerCase();
    var kbs = (data.knowledge || []).filter(function (k) { return scenario === "all" || k.scenario === scenario || k.scenario === "*"; });
    var best = null, bestScore = 0;
    kbs.forEach(function (k) {
      var hay = (k.title + " " + (k.keywords || []).join(" ") + " " + (k.answer || "")).toLowerCase();
      var score = 0;
      (k.keywords || []).forEach(function (kw) { if (t.indexOf(String(kw).toLowerCase()) >= 0) score += 3; });
      t.split(/[\s，。,.?？!！]+/).filter(function (x) { return x.length > 1; })
        .forEach(function (word) { if (hay.indexOf(word) >= 0) score += 1; });
      if (score > bestScore) { bestScore = score; best = k; }
    });
    return bestScore >= 2 ? best : null;
  }
  function builtinReply(p, sourceTag) {
    var data = load().data;
    var t = String(p.text || "");
    var L = p.lang || detectLang(t);
    var lower = t.toLowerCase();
    var t0 = Date.now();
    var history = p.history || [];
    var wantHuman = HANDOFF.some(function (k) { return lower.indexOf(k) >= 0; });
    var negative = NEG.some(function (k) { return lower.indexOf(k) >= 0; });
    var turnNo = history.filter(function (h) { return h.role === "user"; }).length + 1;
    var out, intent, transfer = false, sop = null, sentiment = negative ? "negative" : "neutral";
    var greet = { zh: "您好,这里是声渡智能语音助手,很高兴为您服务。", en: "Hi, this is the VoxOne AI voice assistant — happy to help.", ar: "مرحبًا، أنا مساعد VoxOne الصوتي.", th: "สวัสดีค่ะ นี่คือผู้ช่วยเสียง VoxOne ค่ะ" };

    if (wantHuman) {
      transfer = true; intent = "转人工";
      out = { zh: "好的,正在为您接入人工坐席,已把本次对话的完整上下文同步过去,请稍候。", en: "Sure — connecting you to a human agent now, with the full context handed over. One moment.", ar: "حسنًا، سأحوّلك إلى وكيل بشري الآن مع كامل سياق المحادثة.", th: "ได้ค่ะ กำลังโอนสายให้เจ้าหน้าที่พร้อมบริบทการสนทนาทั้งหมดค่ะ" }[L];
    } else if (turnNo === 1 && t.length < 6) {
      intent = "开场";
      out = greet[L] + (p.mode === "outbound" ? (L === "zh" ? "耽误您一分钟,想跟您同步一个与您账户相关的信息。" : " This will take a minute regarding your account.") : "");
    } else {
      var hit = retrieve(data, p.mode === "omni" ? "all" : p.scenario, t);
      if (hit) {
        intent = hit.title;
        sop = hit.sopId ? { id: hit.sopId, title: hit.sopTitle || hit.title } : null;
        out = L === "zh" ? hit.answer : ((hit.answer_i18n && hit.answer_i18n[L]) || hit.answer);
        if (L !== "zh" && !(hit.answer_i18n && hit.answer_i18n[L])) out = "[" + L.toUpperCase() + "] " + hit.answer;
      } else {
        intent = "一般咨询";
        out = {
          zh: "我理解您的问题。为准确处理,请补充一下具体的订单号/账户信息;同时我已记录您的诉求,可随时为您转接人工。",
          en: "I understand. To help accurately, could you share the order/account reference? I've logged your request and can transfer to a human anytime.",
          ar: "أفهم طلبك. لمساعدتك بدقة، شاركني رقم الطلب/الحساب. سجّلت طلبك ويمكنني التحويل لوكيل بشري.",
          th: "เข้าใจค่ะ ขอเลขคำสั่งซื้อ/บัญชีเพื่อช่วยได้แม่นยำขึ้น และสามารถโอนหาเจ้าหน้าที่ได้ตลอดค่ะ",
        }[L];
      }
      if (negative) {
        sentiment = "negative";
        out = (L === "zh" ? "非常抱歉给您带来困扰,我会优先为您处理。" : "I'm sorry for the trouble — I'll prioritize this. ") + out;
        if (turnNo >= 2) transfer = true;
      }
    }
    var latencyMs = 240 + Math.floor(((t.length * 7 + turnNo * 13) % 260));
    return { text: out, intent: intent, transfer: transfer, sop: sop, sentiment: sentiment, lang: L, turn: turnNo,
      latencyMs: latencyMs, source: sourceTag || modelConfig().mode, engineMs: Date.now() - t0 };
  }

  function buildMessages(p) {
    var data = load().data;
    var hit = retrieve(data, p.mode === "omni" ? "all" : p.scenario, p.text);
    var sop = hit && hit.sopId ? (data.scripts || []).filter(function (s) { return s.id === hit.sopId; })[0] : null;
    var sc = { ecom: "跨境电商/零售", app: "出海App/游戏", fintech: "金融科技/跨境支付", local: "本地生活/教育", auto: "汽车/保险" }[p.scenario] || p.scenario;
    var modeName = { service: "AI 客服(解决问题)", sales: "AI 销售(促成转化)", outbound: "AI 外呼(主动触达)", omni: "全渠道统一 AI(售前答疑 + 售后服务一体,跨语音/文本多渠道,同一套知识库)" }[p.mode] || p.mode;
    var langName = { zh: "简体中文", yue: "粤语", en: "English", ar: "Arabic", th: "Thai", es: "Spanish", id: "Bahasa Indonesia" }[p.lang] || "用户所用语言";
    var sys = "你是「声渡 VoxOne」——商汤科技的语音原生 AI 助手,当前服务【" + sc + "】场景,担任【" + modeName + "】。\n"
      + "规则:①用" + langName + "作答;②口语化、简洁(将用于语音播报,一般不超过 3 句);③礼貌专业、必要时安抚情绪;"
      + "④如用户要求人工、或问题复杂/涉及授权无法自助,则明确表示将转接人工坐席;⑤严格依据下方知识作答,不编造。\n";
    if (hit) sys += "\n【可用知识:" + hit.title + "】\n" + hit.answer + "\n";
    if (sop) sys += "\n【处理步骤 SOP:" + sop.title + "】\n" + (sop.steps || []).map(function (s, i) { return (i + 1) + ". " + s; }).join("\n") + "\n";
    var msgs = [{ role: "system", content: sys }];
    (p.history || []).slice(-8).forEach(function (h) { msgs.push({ role: h.role === "ai" ? "assistant" : "user", content: h.text }); });
    msgs.push({ role: "user", content: p.text || "你好" });
    return { msgs: msgs, intent: hit ? hit.title : "一般咨询", sop: hit && hit.sopId ? { id: hit.sopId, title: hit.sopTitle || hit.title } : null };
  }

  // 带超时的 fetch(静态模式下所有远端调用都是浏览器直连,受 CORS 约束,失败即回退)
  function fetchT(url, opts, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 8000);
    opts = opts || {}; opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
  }
  var trimSlash = function (s) { return String(s || "").replace(/\/$/, ""); };

  function liveReply(p) {
    var cfg = modelConfig(), key = getMeta(MK.apiKey, "");
    var bm = buildMessages(p);
    var L = p.lang || detectLang(p.text || "");
    var t0 = Date.now();
    return fetchT(trimSlash(cfg.endpoint) + cfg.chatPath, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, key ? { Authorization: "Bearer " + key } : {}),
      body: JSON.stringify({ model: cfg.chatModel, messages: bm.msgs, temperature: 0.4, max_tokens: 512, stream: false }),
    }, 12000).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (j) {
      var out = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content)
        || (j.data && j.data.choices && j.data.choices[0] && j.data.choices[0].message && j.data.choices[0].message.content)
        || (j.choices && j.choices[0] && j.choices[0].text) || "";
      if (!out) throw new Error("空回复");
      var lower = out.toLowerCase(), src = String(p.text || "").toLowerCase();
      return {
        text: out.trim(), intent: bm.intent,
        transfer: /转人工|人工坐席|human agent|transfer/.test(lower) || HANDOFF.some(function (k) { return src.indexOf(k) >= 0; }),
        sop: bm.sop, sentiment: NEG.some(function (k) { return src.indexOf(k) >= 0; }) ? "negative" : "neutral",
        lang: L, turn: (p.history || []).filter(function (h) { return h.role === "user"; }).length + 1,
        latencyMs: Date.now() - t0, source: "live", model: cfg.chatModel,
      };
    }).catch(function (e) {
      var r = builtinReply(p, "builtin-fallback");
      r.fallbackError = String(e.message || e);
      return r;
    });
  }
  function reply(p) { return modelConfig().mode === "live" ? liveReply(p) : Promise.resolve(builtinReply(p)); }

  function health() {
    var cfg = modelConfig();
    if (cfg.mode === "builtin") {
      return Promise.resolve({ ok: true, mode: "builtin", latencyMs: 0, note: "静态模式 · 内置对话引擎(浏览器内)已就绪 —— 语音+文本全双工可直接体验" });
    }
    var t0 = Date.now(), key = getMeta(MK.apiKey, "");
    return fetchT(trimSlash(cfg.endpoint) + "/health", { headers: key ? { Authorization: "Bearer " + key } : {} }, 4000)
      .then(function (res) { return { ok: res.ok, mode: "live", status: res.status, latencyMs: Date.now() - t0, endpoint: cfg.endpoint }; })
      .catch(function (e) { return { ok: false, mode: "live", latencyMs: Date.now() - t0, endpoint: cfg.endpoint, error: String(e.message || e) }; });
  }
  function listModels() {
    var cfg = modelConfig();
    if (cfg.mode !== "live") return Promise.resolve({ ok: false, mode: "builtin", models: [], note: "静态模式 · 货架为静态目录;填入端点 + Key 后由浏览器直连拉取(需端点允许跨域)" });
    var key = getMeta(MK.apiKey, ""), t0 = Date.now();
    return fetchT(trimSlash(cfg.endpoint) + "/models", { headers: key ? { Authorization: "Bearer " + key } : {} }, 8000)
      .then(function (res) {
        if (!res.ok) return { ok: false, mode: "live", status: res.status, models: [], latencyMs: Date.now() - t0, error: "HTTP " + res.status };
        return res.json().then(function (j) {
          var models = (j.data || j.models || []).map(function (m) { return typeof m === "string" ? m : m.id; }).filter(Boolean);
          return { ok: true, mode: "live", models: models, latencyMs: Date.now() - t0 };
        });
      })
      .catch(function (e) { return { ok: false, mode: "live", models: [], latencyMs: Date.now() - t0, error: String(e.message || e) }; });
  }
  function bufToB64(buf) {
    var bytes = new Uint8Array(buf), s = "";
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function tts(b) {
    var cfg = modelConfig();
    if (cfg.mode !== "live") return Promise.resolve({ ok: false, fallback: true, note: "静态模式 · 使用浏览器本地合成试听" });
    var key = getMeta(MK.apiKey, "");
    return fetchT(trimSlash(cfg.endpoint) + cfg.ttsPath, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, key ? { Authorization: "Bearer " + key } : {}),
      body: JSON.stringify(Object.assign({
        model: b.model || cfg.ttsModel, input: String(b.text || "").slice(0, 800),
        voice: b.voice || cfg.ttsVoice, response_format: b.format || cfg.ttsFormat,
      }, b.lang ? { language: b.lang } : {})),
    }, 15000).then(function (res) {
      if (!res.ok) return { ok: false, fallback: true, error: "HTTP " + res.status };
      return res.arrayBuffer().then(function (buf) {
        return { ok: true, audioBase64: bufToB64(buf), contentType: res.headers.get("content-type") || "audio/mpeg", model: b.model || cfg.ttsModel };
      });
    }).catch(function (e) { return { ok: false, fallback: true, error: String(e.message || e) }; });
  }
  function asr(b) {
    var cfg = modelConfig();
    if (cfg.mode !== "live") return Promise.resolve({ ok: false, fallback: true, note: "静态模式 · 请用浏览器识别" });
    var key = getMeta(MK.apiKey, "");
    try {
      var bin = atob(b.audioBase64 || ""), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var fd = new FormData();
      fd.append("file", new Blob([arr], { type: b.contentType || "audio/webm" }), b.filename || "audio.webm");
      fd.append("model", b.model || cfg.asrModel);
      if (b.lang) fd.append("language", b.lang);
      return fetchT(trimSlash(cfg.endpoint) + cfg.asrPath, { method: "POST", headers: key ? { Authorization: "Bearer " + key } : {}, body: fd }, 20000)
        .then(function (res) {
          if (!res.ok) return { ok: false, fallback: true, error: "HTTP " + res.status };
          return res.json().then(function (j) { return { ok: true, text: j.text || j.result || "", model: b.model || cfg.asrModel }; });
        })
        .catch(function (e) { return { ok: false, fallback: true, error: String(e.message || e) }; });
    } catch (e) { return Promise.resolve({ ok: false, fallback: true, error: String(e.message || e) }); }
  }

  /* ---------- 会话 token(演示级,非安全凭证)---------------------------- */
  var b64u = {
    enc: function (s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
    dec: function (s) { return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))); },
  };
  function signToken(payload) {
    var body = Object.assign({}, payload, { exp: Math.floor(Date.now() / 1000) + 12 * 3600 });
    return "local." + b64u.enc(JSON.stringify(body));
  }
  function verifyToken(tok) {
    if (!tok || tok.indexOf("local.") !== 0) return null;
    try {
      var body = JSON.parse(b64u.dec(tok.slice(6)));
      if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
      return body;
    } catch (e) { return null; }
  }

  /* ---------- 鉴权上下文 / RBAC 校验 ------------------------------------- */
  var getUser = function (u) { return load().users.filter(function (x) { return x.username === u; })[0] || null; };
  function ctxOf(tok) {
    var p = verifyToken(tok); if (!p) return null;
    var u = getUser(p.u); if (!u) return null;
    return { username: u.username, role: u.role, name: u.name, title: u.title, scenarios: u.scenarios || [], mustChange: !!u.mustChange, perms: permsFor(u.role) };
  }
  var canScene = function (ctx, sc) { return !sc || sc === "*" || inScenario(ctx.scenarios, sc); };
  var meOf = function (ctx) {
    return { username: ctx.username, role: ctx.role, roleLabel: ctx.perms.label, name: ctx.name || ctx.username, title: ctx.title || "",
      scenarios: ctx.scenarios, mustChange: ctx.mustChange, perms: ctx.perms };
  };
  var firstScene = function (ctx) { return (ctx.scenarios || []).filter(function (x) { return x !== "*"; })[0] || null; };
  var scopeFilter = function (ctx) { return ctx.perms.viewAll ? null : firstScene(ctx); };
  var listUsers = function () {
    return load().users.map(function (u) { return { username: u.username, role: u.role, scenarios: (u.scenarios || []).slice(), name: u.name, title: u.title, mustChange: u.mustChange }; })
      .sort(function (a, b) { return a.role === b.role ? (a.username < b.username ? -1 : 1) : (a.role < b.role ? -1 : 1); });
  };

  var CHANGE = {
    "agent.upsert":    { perm: "manageAgents", list: "agents",    scene: function (p) { return p.agent && p.agent.scenario; } },
    "agent.toggle":    { perm: "manageAgents", list: "agents" },
    "agent.delete":    { perm: "manageAgents", list: "agents" },
    "kb.upsert":       { perm: "editConfig",   list: "knowledge", scene: function (p) { return p.kb && p.kb.scenario; } },
    "kb.delete":       { perm: "editConfig",   list: "knowledge" },
    "script.upsert":   { perm: "editConfig",   list: "scripts",   scene: function (p) { return p.script && p.script.scenario; } },
    "script.delete":   { perm: "editConfig",   list: "scripts" },
    "script.push":     { perm: "editConfig",   list: "scripts" },
    "voice.upsert":    { perm: "editConfig",   list: "voices" },
    "voice.delete":    { perm: "editConfig",   list: "voices" },
    "campaign.upsert": { perm: "runOutbound",  list: "campaigns", scene: function (p) { return p.campaign && p.campaign.scenario; } },
    "campaign.toggle": { perm: "runOutbound",  list: "campaigns" },
    "campaign.delete": { perm: "runOutbound",  list: "campaigns" },
    "number.upsert":   { perm: "editConfig",   list: "numbers" },
    "number.delete":   { perm: "editConfig",   list: "numbers" },
  };
  // payload 的记录字段名:与服务端一致 —— knowledge→kb,其余为列表名去掉尾部 s
  var RECKEY = { knowledge: "kb", agents: "agent", scripts: "script", voices: "voice", campaigns: "campaign", numbers: "number" };

  function applyChange(ctx, kind, payload) {
    var spec = CHANGE[kind];
    if (!spec) throw { code: 400, msg: "未知操作 " + kind };
    if (!ctx.perms[spec.perm]) throw { code: 403, msg: "无「" + spec.perm + "」权限" };
    var D = load().data;
    var arr = D[spec.list] = D[spec.list] || [];
    var detail = "";

    if (kind.slice(-7) === ".upsert") {
      var rec = payload[RECKEY[spec.list]] || null;
      if (!rec) throw { code: 400, msg: "缺少记录内容" };
      var sc = spec.scene ? spec.scene(payload) : null;
      if (sc && !canScene(ctx, sc)) throw { code: 403, msg: "无权维护该场景数据" };
      var ex = arr.filter(function (x) { return x.id === rec.id; })[0];
      if (ex) Object.assign(ex, rec); else arr.unshift(Object.assign({ calls: 0 }, rec));
      detail = rec.name || rec.title || rec.id;
    } else {
      var id = payload.id;
      var target = arr.filter(function (x) { return x.id === id; })[0];
      if (kind.slice(-7) === ".delete") {
        if (target && target.scenario && !canScene(ctx, target.scenario)) throw { code: 403, msg: "无权操作该场景数据" };
        D[spec.list] = arr.filter(function (x) { return x.id !== id; });
        detail = target ? (target.name || target.title || id) : "";
      } else {
        if (!target) throw { code: 404, msg: "记录不存在" };
        if (target.scenario && !canScene(ctx, target.scenario)) throw { code: 403, msg: "无权操作该场景数据" };
        if (kind === "agent.toggle" || kind === "campaign.toggle") {
          if (kind === "campaign.toggle") target.status = target.status === "running" ? "paused" : "running";
          else target.status = target.status === "on" ? "off" : "on";
          detail = (target.name || target.title) + "→" + target.status;
        } else if (kind.slice(-5) === ".push") {
          target.pushCount = (target.pushCount || 0) + 1;
          target.pushedAt = nowIso();
          detail = target.title;
        } else throw { code: 400, msg: "未处理 " + kind };
      }
    }
    var d = load(); d.ver = (d.ver || 0) + 1; save();
    logAudit(ctx.username, "change:" + kind, "");
    return { ver: d.ver, detail: detail };
  }

  function exposedAgents() {
    return (load().data.agents || []).filter(function (a) { return a.status === "on"; }).map(function (a) {
      return {
        id: a.id, name: a.name, scenario: a.scenario, mode: a.mode, channels: a.channel,
        langs: a.langs || [], voice: a.voiceId,
        capability: a.mode === "outbound" ? "voice.outbound" : a.mode === "sales" ? "conversation.sales" : "conversation.service",
        endpoint: "/api/agent-gateway/invoke",
        schema: { input: { text: "string", scenario: "string", mode: "string", history: "array", lang: "string" }, output: { text: "string", intent: "string", transfer: "boolean" } },
      };
    });
  }

  /* ---------- 路由(等价 server/server.js 的 api())----------------------- */
  var ok = function (data) { return { status: 200, data: data }; };
  var err = function (status, msg) { return { status: status, data: { error: msg } }; };

  function request(path, method, body, tok) {
    method = (method || "GET").toUpperCase();
    body = body || {};
    var u, qs;
    try { u = new URL(path, "http://voxone.local"); qs = u.searchParams; } catch (e) { return Promise.resolve(err(400, "bad path")); }
    var p = u.pathname;

    return Promise.resolve().then(function () {
      /* —— 登录 —— */
      if (p === "/api/login" && method === "POST") {
        var su = getUser(String(body.username || "").trim());
        if (!su || su.pass !== String(body.password || "")) return err(401, "账号或密码错误");
        logAudit(su.username, "login", "");
        return ok({ token: signToken({ u: su.username, r: su.role }), me: meOf({ username: su.username, role: su.role, name: su.name, title: su.title, scenarios: su.scenarios, mustChange: !!su.mustChange, perms: permsFor(su.role) }) });
      }

      var ctx = ctxOf(tok);
      if (!ctx) return err(401, "未登录或会话过期");

      if (p === "/api/bootstrap" && method === "GET") {
        var d = load();
        var out = { me: meOf(ctx), data: clone(d.data), ver: d.ver, scenarios: SCENARIOS, model: modelConfig(), stats: callStats(scopeFilter(ctx)), staticMode: true };
        if (ctx.perms.manageUsers) out.users = listUsers();
        if (ctx.perms.manageIntegration || ctx.perms.viewAll) out.gwToken = getMeta("gw_token");
        return ok(out);
      }

      if (p === "/api/password" && method === "POST") {
        var me = getUser(ctx.username);
        if (me.pass !== String(body.current || "")) return err(400, "当前密码不正确");
        if (!body.next || String(body.next).length < 6) return err(400, "新密码至少 6 位");
        if (body.next === DEFAULT_PW) return err(400, "新密码不能与初始密码相同");
        me.pass = String(body.next); me.mustChange = 0; save();
        logAudit(ctx.username, "password.change", "");
        return ok({ ok: true });
      }

      if (p === "/api/change" && method === "POST") {
        try { var r = applyChange(ctx, body.kind, body.payload || {}); return ok({ ok: true, ver: r.ver, detail: r.detail }); }
        catch (e) { return err(e.code || 500, e.msg || String(e.message || e)); }
      }

      /* —— 对话大脑 —— */
      if (p === "/api/rt/reply" && method === "POST") {
        if (!ctx.perms.useWorkbench) return err(403, "无权使用坐席工作台");
        if (body.scenario && !canScene(ctx, body.scenario)) return err(403, "无权在该场景对话");
        return reply(Object.assign({}, body, { agentName: body.agentName || ctx.name })).then(function (r) { return ok({ reply: r }); });
      }
      if (p === "/api/rt/health" && method === "GET") return health().then(ok);

      /* —— 会话留痕 —— */
      if (p === "/api/call" && method === "POST") {
        if (!ctx.perms.useWorkbench) return err(403, "无权产生会话留痕");
        if (body.scenario && !canScene(ctx, body.scenario)) return err(403, "无权在该场景留痕");
        var cid = insertCall(Object.assign({}, body, { actor: ctx.username, actorName: ctx.name || ctx.username }));
        logAudit(ctx.username, "call.add", (body.scenario || "") + "/" + (body.intent || ""));
        return ok({ ok: true, id: cid });
      }
      if (p === "/api/calls" && method === "GET") {
        var scenario = qs.get("scenario") || null;
        if (scenario && !ctx.perms.viewAll && !canScene(ctx, scenario)) return err(403, "无权查看该场景");
        var rows = listCalls({ scenario: scenario, mode: qs.get("mode"), channel: qs.get("channel"), resolvedBy: qs.get("resolvedBy"), q: qs.get("q"), limit: 300 });
        if (!ctx.perms.viewAll) rows = rows.filter(function (r) { return canScene(ctx, r.scenario); });
        return ok({ calls: rows, stats: callStats(scopeFilter(ctx)) });
      }
      if (p === "/api/call" && method === "GET") {
        var c = getCall(qs.get("id"));
        if (!c) return err(404, "会话不存在");
        if (!ctx.perms.viewAll && !canScene(ctx, c.scenario)) return err(403, "无权查看");
        return ok({ call: c });
      }
      if (p === "/api/qa" && method === "POST") {
        if (!ctx.perms.qa) return err(403, "无质检权限");
        updateCallQA(body.id, body.qaScore, body.tags);
        logAudit(ctx.username, "qa.score", body.id + "=" + body.qaScore);
        return ok({ ok: true });
      }

      /* —— SenseAudio 接入 —— */
      if (p === "/api/model" && method === "POST") {
        if (!ctx.perms.manageModel) return err(403, "无权配置模型接入");
        setModelCreds(body); logAudit(ctx.username, "model.config", body.endpoint || "");
        return ok({ ok: true, model: modelConfig() });
      }
      if (p === "/api/model/models" && method === "GET") {
        if (!(ctx.perms.manageModel || ctx.perms.useWorkbench)) return err(403, "无权限");
        return listModels().then(ok);
      }
      if (p === "/api/tts" && method === "POST") {
        if (!ctx.perms.useWorkbench) return err(403, "无权限");
        return tts(body).then(ok);
      }
      if (p === "/api/asr" && method === "POST") {
        if (!ctx.perms.useWorkbench) return err(403, "无权限");
        return asr(body).then(ok);
      }

      /* —— 统一 Agent 平台对接 —— */
      if (p === "/api/integration" && method === "GET") {
        if (!(ctx.perms.manageIntegration || ctx.perms.viewAll)) return err(403, "无权限");
        var D = load().data;
        return ok({
          config: {
            hubName: (D.integration || {}).hubName || "统一 Agent 管理平台",
            hubEndpoint: getMeta("hub_endpoint", ""),
            hubTokenSet: !!getMeta("hub_token"),
            selfBase: getMeta("self_base", "http://localhost:5190"),
          },
          gateway: { token: getMeta("gw_token"), agentsUrl: "/api/agent-gateway/agents", invokeUrl: "/api/agent-gateway/invoke" },
          exposed: exposedAgents(), events: load().integ.slice(0, 40).map(clone),
          staticMode: true,
        });
      }
      if (p === "/api/integration/config" && method === "POST") {
        if (!ctx.perms.manageIntegration) return err(403, "无权限");
        if (body.hubEndpoint != null) setMeta("hub_endpoint", body.hubEndpoint);
        if (body.hubToken) setMeta("hub_token", body.hubToken);
        if (body.selfBase != null) setMeta("self_base", body.selfBase);
        if (body.hubName) { var dd = load(); dd.data.integration = dd.data.integration || {}; dd.data.integration.hubName = body.hubName; dd.ver++; save(); }
        if (body.rotateGw) setMeta("gw_token", "vx_" + rndHex(18));
        logInteg("config", body.hubEndpoint || "hub", true, "更新对接配置");
        return ok({ ok: true, gwToken: getMeta("gw_token") });
      }
      if (p === "/api/integration/sync" && method === "POST") {
        if (!ctx.perms.manageIntegration) return err(403, "无权限");
        var endpoint = getMeta("hub_endpoint", ""), htok = getMeta("hub_token", "");
        var selfBase = getMeta("self_base", "http://localhost:5190"), gwT = getMeta("gw_token");
        var agents = exposedAgents();
        var finish = function (hubOk, note) {
          logInteg("sync", endpoint || "本地登记", hubOk || !endpoint, "注册 " + agents.length + " 个 Agent → " + note);
          var dz = load(); dz.data.integration = dz.data.integration || {};
          dz.data.integration.lastSync = nowIso(); dz.data.integration.exposedCount = agents.length; dz.ver++; save();
          return ok({ ok: true, count: agents.length, results: agents.map(function (a) { return { id: a.id, ok: hubOk, note: note }; }) });
        };
        if (!endpoint) return finish(false, "未配置 Hub 端点,已本地登记");
        return fetchT(trimSlash(endpoint) + "/api/external/register", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-ingest-key": htok },
          body: JSON.stringify({ source: "voxone", platform: "声渡 VoxOne", callbackBase: selfBase, gwToken: gwT, agents: agents }),
        }, 8000).then(function (r) {
          return finish(r.ok, r.ok ? ("已注册到统一平台 · HTTP " + r.status) : ("HTTP " + r.status));
        }).catch(function (e) {
          // 静态模式由浏览器直连 Hub,跨域/离线都会落到这里 —— 如实上报,不假装成功
          return finish(false, String(e.message || e) + "(静态模式为浏览器直连,可能被 Hub 的跨域策略拦截)");
        });
      }

      if (p === "/api/reset" && method === "POST") {
        if (ctx.role !== "superadmin") return err(403, "仅平台管理员可重置");
        var keepUsers = load().users, keepMeta = load().meta;
        DB = freshDB(); DB.users = keepUsers; DB.meta = keepMeta; save();
        logAudit("system", "data.reset", "");
        return ok({ ok: true, ver: DB.ver });
      }

      /* —— 账号与权限 —— */
      if (p === "/api/users" && method === "GET") {
        if (!ctx.perms.manageUsers) return err(403, "无权限");
        return ok({ users: listUsers() });
      }
      if (p === "/api/users" && method === "POST") {
        if (!ctx.perms.manageUsers) return err(403, "无权限");
        var d2 = load(), ex2 = getUser(body.username);
        if (ex2) { ex2.role = body.role; ex2.scenarios = body.scenarios || []; ex2.name = body.name || null; ex2.title = body.title || null; }
        else d2.users.push({ username: body.username, pass: body.password || DEFAULT_PW, role: body.role, scenarios: body.scenarios || [], name: body.name || null, title: body.title || null, mustChange: 1 });
        save(); logAudit(ctx.username, "user.upsert", body.username);
        return ok({ ok: true, users: listUsers() });
      }
      if (p === "/api/users/delete" && method === "POST") {
        if (!ctx.perms.manageUsers) return err(403, "无权限");
        if (body.username === "admin") return err(400, "不可删除平台管理员");
        var d3 = load(); d3.users = d3.users.filter(function (x) { return x.username !== body.username; }); save();
        logAudit(ctx.username, "user.delete", body.username);
        return ok({ ok: true, users: listUsers() });
      }
      if (p === "/api/users/resetpw" && method === "POST") {
        if (!ctx.perms.manageUsers) return err(403, "无权限");
        var tu = getUser(body.username);
        if (tu) { tu.pass = DEFAULT_PW; tu.mustChange = 1; save(); }
        logAudit(ctx.username, "user.resetpw", body.username);
        return ok({ ok: true, defaultPw: DEFAULT_PW });
      }
      if (p === "/api/audit" && method === "GET") {
        if (!(ctx.perms.manageUsers || ctx.perms.viewAll)) return err(403, "无权限");
        return ok({ audit: load().audit.slice(0, 100).map(clone) });
      }

      return err(404, "未知接口 " + p);
    });
  }

  /* ---------- 对接网关(供嵌入式 widget 在无服务端时直连本地引擎)-------- */
  function gateway(kind, body) {
    body = body || {};
    if (kind === "agents") return Promise.resolve({ platform: "声渡 VoxOne", version: "1.0", agents: exposedAgents() });
    if (kind === "capabilities") return Promise.resolve({ platform: "声渡 VoxOne", version: "1.0", voice: voiceCaps() });
    if (kind === "tts") return tts(body);
    if (kind === "asr") return asr(body);
    if (kind === "invoke") {
      return reply({ scenario: body.scenario || "ecom", mode: body.mode || "service", agentName: body.agentName || "统一平台调用", history: body.history || [], text: body.text || "", lang: body.lang })
        .then(function (r) {
          logInteg("invoke", body.from || "嵌入式 widget", true, (body.scenario || "") + "/" + (body.mode || "") + " · " + (r.intent || ""));
          return { reply: r };
        });
    }
    return Promise.reject(new Error("unknown gateway kind " + kind));
  }

  w.VXLOCAL = {
    request: request,
    gateway: gateway,
    gwToken: function () { return getMeta("gw_token"); },
    reset: function () { DB = freshDB(); save(); },
    DEFAULT_PW: DEFAULT_PW,
    // file:// 下必然无服务端;http(s) 下由 app.js 探测到 /api 不可用时再启用
    presumed: (w.location && w.location.protocol === "file:"),
  };
})(typeof window !== "undefined" ? window : this);
