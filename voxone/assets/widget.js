/* ============================================================================
 *  声渡 VoxOne · 悬浮语音客服 Widget(可嵌入任意客户网页 / H5)
 *  ---------------------------------------------------------------------------
 *  · 完全自包含:内联全部 CSS/HTML,不依赖 styles.css / app.js / voice.js。
 *  · 引入方式:<script src=".../assets/widget.js" data-token="网关令牌" ...></script>
 *  · 由 VoxOne 网关驱动:POST /api/agent-gateway/invoke?token=<令牌>
 *  · 全双工语音:Web Speech API(SpeechRecognition 连续识别 + speechSynthesis 朗读),
 *               AI 播报时用户开口即打断(barge-in);不支持 / 未授权时优雅降级为纯文本。
 *  · 品牌:商汤 SenseTime · 声渡 VoxOne · SenseAudio V2.0
 *  暴露:window.VoxOneWidget = { open(), close(), toggle() }
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__VOXONE_WIDGET_LOADED__) return;      // 防重复注入
  window.__VOXONE_WIDGET_LOADED__ = true;

  /* ---------- 1. 读取配置(script 标签 data-* 属性) -------------------- */
  var thisScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');
  var ds = (thisScript && thisScript.dataset) || {};
  var CFG = {
    base: (ds.voxoneBase || "").replace(/\/+$/, ""), // 默认 '' 即同源
    token: ds.token || "",
    scenario: ds.scenario || "ecom",
    mode: ds.mode || "service",
    lang: ds.lang || "zh",
    title: ds.title || "声渡智能语音客服",
    accent: ds.accent || "" // 可选主色
  };
  // 静态模式:演示页同时加载了 assets/seed.js + assets/local-backend.js 时,若压根
  // 连不上 VoxOne 网关(file:// 打开,或纯静态托管),就改用页面内引擎应答。
  // 客户站点真实嵌入时不会引入 local-backend.js,只能走 HTTP 网关,行为与从前一致。
  // true=已确定用本地;false=已确定用远端网关;null=未知,首次调用时探测。
  var LOCAL_GW = (!CFG.base && !!window.VXLOCAL && location.protocol === "file:") ? true : null;
  if (!CFG.token && !window.VXLOCAL) {
    console.warn("[VoxOneWidget] 缺少 data-token(网关令牌),widget 仍会渲染但无法应答。");
  }

  /* ---------- 网关统一入口:HTTP 网关,不可用时回退页面内引擎 ------------ */
  function localGw(kind, body) { return window.VXLOCAL.gateway(kind, body || {}); }
  function canFallback() { return LOCAL_GW === null && !CFG.base && !!window.VXLOCAL; }

  function gwCall(kind, method, body) {
    if (LOCAL_GW === true) return localGw(kind, body);
    var url = CFG.base + "/api/agent-gateway/" + kind + "?token=" + encodeURIComponent(CFG.token);
    var opts = method === "POST"
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }
      : {};
    return fetch(url, opts).then(function (r) {
      var isJson = (r.headers.get("content-type") || "").indexOf("application/json") >= 0;
      // 静态服务器对 /api/* 只会回非 JSON 的 404/405 —— 据此判定「没有网关」
      if (!r.ok && !isJson && canFallback()) { LOCAL_GW = true; return localGw(kind, body); }
      if (!r.ok) return Promise.reject(new Error("HTTP " + r.status));
      LOCAL_GW = false;
      return r.json();
    }, function (e) {
      if (canFallback()) { LOCAL_GW = true; return localGw(kind, body); }
      throw e;
    });
  }

  var LANG_BCP = { zh: "zh-CN", yue: "zh-HK", en: "en-US", es: "es-ES", ar: "ar-SA", th: "th-TH", vi: "vi-VN", id: "id-ID", ja: "ja-JP", pt: "pt-BR" };
  var WELCOME = {
    zh: "您好!我是声渡智能语音客服 🌊,可以帮您解答订单、物流、退换货等问题。点击下方 🎙️ 也能直接和我说话。",
    en: "Hi! I'm the VoxOne voice assistant 🌊. Ask me about orders, shipping or returns — or tap the 🎙️ button to talk to me.",
    yue: "你好!我係聲渡智能語音客服 🌊,可以幫你解答訂單、物流、退換貨等問題。撳下面 🎙️ 都可以直接同我講嘢。",
    ja: "こんにちは!VoxOne 音声アシスタントです 🌊。ご注文・配送・返品などお気軽にどうぞ。🎙️ を押せば音声でも話せます。"
  };
  var T = {
    inputPlaceholder: { zh: "输入消息…", en: "Type a message…" },
    send: { zh: "发送", en: "Send" },
    thinking: { zh: "正在应答…", en: "Thinking…" },
    transferred: { zh: "已为您转接人工客服,请稍候…", en: "Transferred to a human agent, please hold…" },
    netErr: { zh: "连接失败,请稍后重试", en: "Connection failed, please retry" },
    noMic: {
      zh: "当前浏览器不支持 / 未授权语音,已切换为文字模式",
      en: "Voice unavailable / not permitted — switched to text mode"
    },
    micOn: { zh: "正在聆听…请说话,停顿即自动识别", en: "Listening… speak, pauses auto-submit" },
    recognizing: { zh: "识别中…", en: "Transcribing…" },
    asrEmpty: { zh: "没听清,请再说一次", en: "Didn't catch that, please try again" },
    voiceFallback: { zh: "实时语音端点暂不可用,已切换浏览器语音,请再说一次", en: "Live voice endpoint unavailable — switched to browser voice, please try again" },
    liveVoice: { zh: "SenseAudio 实时语音", en: "SenseAudio live voice" },
    browserVoice: { zh: "浏览器本地语音", en: "browser voice" }
  };
  function t(key) {
    var m = T[key] || {};
    return m[CFG.lang] || m.en || m.zh || "";
  }
  function welcomeText() {
    return WELCOME[CFG.lang] || WELCOME.en || WELCOME.zh;
  }

  /* ---------- 2. 注入自包含样式(全部 .vxw- 前缀,避免污染宿主页) ------ */
  var ACCENT = CFG.accent || "#F0513C";
  var GRAD_BRAND = CFG.accent
    ? "linear-gradient(135deg," + CFG.accent + "," + CFG.accent + ")"
    : "linear-gradient(135deg,#F0513C,#FF7A3D)";
  var CSS =
    "#vxw-root{--vxw-navy:#0E2440;--vxw-navy-0:#0A1B33;--vxw-navy-2:#12305A;--vxw-line:#213b60;--vxw-line-2:#2b4a72;" +
    "--vxw-ink-0:#F4F7FB;--vxw-ink-1:#DCE7F5;--vxw-ink-2:#9FB3CC;--vxw-ink-3:#6f88a8;" +
    "--vxw-accent:" + ACCENT + ";--vxw-coral-ink:#ffd9d1;--vxw-teal:#22C7D6;" +
    "--vxw-grad-brand:" + GRAD_BRAND + ";--vxw-grad-voice:linear-gradient(135deg,#22C7D6,#4E7BE0 55%,#7C6CFF);" +
    "--vxw-font:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',Roboto,Helvetica,Arial,sans-serif;}" +
    "#vxw-root,#vxw-root *{box-sizing:border-box}" +
    "#vxw-root{position:fixed;z-index:2147483000;font-family:var(--vxw-font);-webkit-font-smoothing:antialiased}" +

    /* 悬浮气泡按钮 */
    "#vxw-bubble{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:60px;height:60px;border-radius:50%;" +
    "border:0;cursor:pointer;background:var(--vxw-grad-brand);box-shadow:0 10px 30px rgba(240,81,60,.42),0 2px 8px rgba(0,0,0,.25);" +
    "display:grid;place-items:center;color:#fff;font-size:26px;transition:transform .18s,box-shadow .18s;animation:vxw-in .35s cubic-bezier(.2,1.2,.3,1)}" +
    "#vxw-bubble:hover{transform:translateY(-2px) scale(1.05)}" +
    "#vxw-bubble:active{transform:scale(.96)}" +
    "#vxw-bubble .vxw-ring{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 0 rgba(240,81,60,.5);animation:vxw-pulse 2.4s infinite}" +
    "#vxw-bubble.vxw-hidden{transform:scale(0);opacity:0;pointer-events:none}" +
    "@keyframes vxw-pulse{0%{box-shadow:0 0 0 0 rgba(240,81,60,.45)}70%{box-shadow:0 0 0 16px rgba(240,81,60,0)}100%{box-shadow:0 0 0 0 rgba(240,81,60,0)}}" +
    "@keyframes vxw-in{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}" +

    /* 面板 */
    "#vxw-panel{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:384px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 40px);" +
    "background:linear-gradient(180deg,#0f2748,#0c1f3a);border:1px solid var(--vxw-line-2);border-radius:20px;overflow:hidden;" +
    "box-shadow:0 24px 60px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.02);display:flex;flex-direction:column;" +
    "transform-origin:bottom right;transition:transform .22s cubic-bezier(.2,.9,.3,1),opacity .22s;color:var(--vxw-ink-1)}" +
    "#vxw-panel.vxw-hidden{transform:scale(.6) translateY(20px);opacity:0;pointer-events:none}" +

    /* 顶部品牌条 */
    "#vxw-head{padding:14px 14px 13px;background:linear-gradient(120deg,rgba(240,81,60,.16),rgba(34,199,214,.1));border-bottom:1px solid var(--vxw-line);display:flex;align-items:center;gap:11px}" +
    "#vxw-head .vxw-logo{width:38px;height:38px;border-radius:11px;background:var(--vxw-grad-voice);display:grid;place-items:center;font-size:19px;box-shadow:0 6px 16px rgba(78,123,224,.4);flex:0 0 auto}" +
    "#vxw-head .vxw-tt{flex:1;min-width:0}" +
    "#vxw-head .vxw-tt b{display:block;font-size:14.5px;color:#fff;font-weight:700;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "#vxw-head .vxw-tt .vxw-sub{display:flex;align-items:center;gap:7px;margin-top:3px}" +
    "#vxw-head .vxw-tt small{font-size:10.5px;color:var(--vxw-ink-2)}" +
    "#vxw-head .vxw-badge{font-size:9.5px;font-weight:700;color:#8be6f0;border:1px solid rgba(34,199,214,.35);background:rgba(34,199,214,.12);padding:1px 6px;border-radius:20px;white-space:nowrap}" +
    "#vxw-head .vxw-x{width:30px;height:30px;border-radius:8px;border:1px solid var(--vxw-line);background:rgba(255,255,255,.04);color:var(--vxw-ink-2);cursor:pointer;font-size:16px;display:grid;place-items:center;flex:0 0 auto;transition:.15s}" +
    "#vxw-head .vxw-x:hover{color:#fff;border-color:var(--vxw-teal)}" +

    /* 消息区 */
    "#vxw-msgs{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:11px;scroll-behavior:smooth}" +
    "#vxw-msgs::-webkit-scrollbar{width:7px}#vxw-msgs::-webkit-scrollbar-thumb{background:#26436b;border-radius:6px}" +
    ".vxw-bub{max-width:82%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;word-wrap:break-word;white-space:pre-wrap;animation:vxw-bub .2s ease}" +
    "@keyframes vxw-bub{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
    ".vxw-bub.vxw-user{align-self:flex-end;background:linear-gradient(135deg,#1b4170,#20406a);border:1px solid var(--vxw-line-2);color:var(--vxw-ink-0);border-bottom-right-radius:4px}" +
    ".vxw-bub.vxw-ai{align-self:flex-start;background:linear-gradient(135deg,#123a52,#0f2f4c);border:1px solid rgba(34,199,214,.32);color:var(--vxw-ink-1);border-bottom-left-radius:4px}" +
    ".vxw-bub.vxw-sys{align-self:center;background:rgba(240,81,60,.1);border:1px dashed rgba(240,81,60,.4);color:var(--vxw-coral-ink);font-size:12px;max-width:92%;text-align:center}" +
    ".vxw-bub .vxw-meta{font-size:10px;color:var(--vxw-ink-3);margin-bottom:3px;display:flex;gap:6px;align-items:center}" +
    ".vxw-bub .vxw-meta .vxw-i{font-size:9px;padding:0 5px;border-radius:8px;background:rgba(34,199,214,.14);color:#8be6f0}" +
    ".vxw-typing{display:inline-flex;gap:4px;align-items:center;padding:2px 0}" +
    ".vxw-typing i{width:6px;height:6px;border-radius:50%;background:var(--vxw-teal);opacity:.5;animation:vxw-dot 1s infinite}" +
    ".vxw-typing i:nth-child(2){animation-delay:.15s}.vxw-typing i:nth-child(3){animation-delay:.3s}" +
    "@keyframes vxw-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}" +

    /* 波形 */
    "#vxw-wave{height:0;overflow:hidden;transition:height .2s;display:flex;align-items:center;justify-content:center;gap:3px;background:rgba(34,199,214,.05)}" +
    "#vxw-wave.vxw-show{height:34px}" +
    "#vxw-wave i{width:3px;height:20%;border-radius:3px;background:var(--vxw-teal)}" +
    "#vxw-wave.vxw-live i{animation:vxw-wv .9s ease-in-out infinite}" +
    "#vxw-wave.vxw-speak i{background:var(--vxw-accent)}" +
    "#vxw-wave i:nth-child(2n){animation-delay:.1s}#vxw-wave i:nth-child(3n){animation-delay:.22s}#vxw-wave i:nth-child(4n){animation-delay:.32s}#vxw-wave i:nth-child(5n){animation-delay:.15s}" +
    "@keyframes vxw-wv{0%,100%{height:15%}50%{height:92%}}" +

    /* 底部输入 */
    "#vxw-foot{border-top:1px solid var(--vxw-line);padding:11px 12px;background:rgba(10,27,51,.55);display:flex;align-items:flex-end;gap:8px}" +
    "#vxw-input{flex:1;resize:none;max-height:96px;min-height:38px;background:#0d223f;border:1px solid var(--vxw-line-2);color:var(--vxw-ink-0);" +
    "padding:9px 12px;border-radius:11px;font-size:13.5px;font-family:inherit;line-height:1.4;outline:none;transition:.14s}" +
    "#vxw-input:focus{border-color:var(--vxw-teal);box-shadow:0 0 0 3px rgba(34,199,214,.14)}" +
    "#vxw-input::placeholder{color:var(--vxw-ink-3)}" +
    ".vxw-fbtn{width:40px;height:40px;flex:0 0 auto;border-radius:11px;border:1px solid var(--vxw-line-2);background:#13315a;color:var(--vxw-ink-1);cursor:pointer;font-size:17px;display:grid;place-items:center;transition:.14s}" +
    ".vxw-fbtn:hover{border-color:var(--vxw-teal);color:#fff}" +
    ".vxw-fbtn:disabled{opacity:.45;cursor:not-allowed}" +
    "#vxw-send{background:var(--vxw-grad-brand);border:0;color:#fff;box-shadow:0 5px 14px rgba(240,81,60,.32)}" +
    "#vxw-send:hover{filter:brightness(1.07)}" +
    "#vxw-mic.vxw-on{background:var(--vxw-grad-voice);border:0;color:#fff;box-shadow:0 0 0 3px rgba(34,199,214,.25);animation:vxw-micp 1.3s infinite}" +
    "@keyframes vxw-micp{0%{box-shadow:0 0 0 0 rgba(34,199,214,.4)}70%{box-shadow:0 0 0 9px rgba(34,199,214,0)}100%{box-shadow:0 0 0 0 rgba(34,199,214,0)}}" +

    /* toast */
    "#vxw-toast{position:fixed;bottom:96px;right:22px;z-index:2147483001;background:#13345c;border:1px solid var(--vxw-line-2);color:#fff;" +
    "padding:10px 16px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:13px;font-family:var(--vxw-font);max-width:280px;" +
    "opacity:0;transform:translateY(8px);transition:.22s;pointer-events:none}" +
    "#vxw-toast.vxw-show{opacity:1;transform:none}" +
    "#vxw-toast.vxw-err{border-color:rgba(255,107,107,.55)}" +
    "#vxw-toast.vxw-info{border-color:rgba(34,199,214,.5)}" +

    /* 移动端:面板占满宽度 */
    "@media(max-width:480px){" +
    "#vxw-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0;border:0}" +
    "#vxw-bubble{right:16px;bottom:16px}" +
    "#vxw-toast{right:12px;left:12px;max-width:none}" +
    "}";

  var styleEl = document.createElement("style");
  styleEl.id = "vxw-style";
  styleEl.textContent = CSS;
  (document.head || document.documentElement).appendChild(styleEl);

  /* ---------- 3. 构建 DOM ---------------------------------------------- */
  function waveBars() {
    var s = "";
    for (var i = 0; i < 14; i++) s += "<i></i>";
    return s;
  }
  var root = document.createElement("div");
  root.id = "vxw-root";
  root.innerHTML =
    '<button id="vxw-bubble" aria-label="打开语音客服"><span class="vxw-ring"></span>🎧</button>' +
    '<section id="vxw-panel" class="vxw-hidden" role="dialog" aria-label="' + esc(CFG.title) + '">' +
      '<header id="vxw-head">' +
        '<div class="vxw-logo">🌊</div>' +
        '<div class="vxw-tt"><b>' + esc(CFG.title) + '</b>' +
          '<div class="vxw-sub"><small>声渡 VoxOne</small><span class="vxw-badge">SenseAudio V2.0</span>' +
            '<span class="vxw-badge vxw-vmode" id="vxw-vmode" style="display:none"></span></div>' +
        '</div>' +
        '<button class="vxw-x" id="vxw-close" aria-label="关闭">✕</button>' +
      '</header>' +
      '<div id="vxw-wave">' + waveBars() + '</div>' +
      '<div id="vxw-msgs" aria-live="polite"></div>' +
      '<footer id="vxw-foot">' +
        '<button class="vxw-fbtn" id="vxw-mic" title="语音对话" aria-label="语音对话">🎙️</button>' +
        '<textarea id="vxw-input" rows="1" placeholder="' + esc(t("inputPlaceholder")) + '"></textarea>' +
        '<button class="vxw-fbtn" id="vxw-send" title="发送" aria-label="发送">➤</button>' +
      '</footer>' +
    '</section>' +
    '<div id="vxw-toast" role="status"></div>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var elBubble = $("vxw-bubble"),
      elPanel = $("vxw-panel"),
      elMsgs = $("vxw-msgs"),
      elInput = $("vxw-input"),
      elSend = $("vxw-send"),
      elMic = $("vxw-mic"),
      elWave = $("vxw-wave"),
      elToast = $("vxw-toast");

  /* ---------- 4. 状态 --------------------------------------------------- */
  var history = [];          // [{role:'user'|'ai', text}]
  var sending = false;
  var welcomed = false;
  var netToastShown = false;
  var toastTimer = null;
  var serverVoice = false;   // true=已接入真实 SenseAudio 端点,走服务端 TTS/ASR
  var capsFetched = false;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function scrollDown() { elMsgs.scrollTop = elMsgs.scrollHeight; }

  function addBubble(role, text, opts) {
    opts = opts || {};
    var b = document.createElement("div");
    b.className = "vxw-bub vxw-" + role;
    var inner = "";
    if (role === "ai" && opts.intent) {
      inner += '<div class="vxw-meta">声渡 AI<span class="vxw-i">' + esc(opts.intent) + "</span></div>";
    }
    inner += esc(text);
    b.innerHTML = inner;
    elMsgs.appendChild(b);
    scrollDown();
    return b;
  }

  function showTyping() {
    var b = document.createElement("div");
    b.className = "vxw-bub vxw-ai";
    b.id = "vxw-typing";
    b.innerHTML = '<div class="vxw-typing"><i></i><i></i><i></i></div>';
    elMsgs.appendChild(b);
    scrollDown();
    return b;
  }
  function removeTyping() {
    var e = $("vxw-typing");
    if (e) e.remove();
  }

  function toast(msg, kind) {
    elToast.textContent = msg;
    elToast.className = "vxw-show " + (kind ? "vxw-" + kind : "");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.className = ""; }, 3200);
  }

  /* ---------- 5. 网关调用 ---------------------------------------------- */
  function invoke(text) {
    return gwCall("invoke", "POST", {
      scenario: CFG.scenario,
      mode: CFG.mode,
      text: text,
      history: history.slice(-20),
      lang: CFG.lang
    }).then(function (j) {
      return (j && j.reply) || {};
    });
  }

  // 探测服务端语音能力:live=用真实 SenseAudio TTS/ASR,builtin=用浏览器本地语音
  function fetchCaps() {
    return gwCall("capabilities", "GET").then(function (j) {
      var v = (j && j.voice) || null;
      serverVoice = !!(v && v.serverVoice);
      capsFetched = true;
      updateVoiceBadge();
    }).catch(function () { capsFetched = true; updateVoiceBadge(); });
  }

  function updateVoiceBadge() {
    var el = $("vxw-vmode"); if (!el) return;
    el.style.display = "";
    if (serverVoice) { el.textContent = "⚡ " + t("liveVoice"); el.style.color = "#8be6f0"; el.style.borderColor = "rgba(34,199,214,.35)"; }
    else { el.textContent = "🎙️ " + t("browserVoice"); el.style.color = "#9FB3CC"; el.style.borderColor = "rgba(159,179,204,.3)"; }
  }

  function sendText(text) {
    text = (text || "").trim();
    if (!text || sending) return;
    sending = true;
    elSend.disabled = true;
    addBubble("user", text);
    history.push({ role: "user", text: text });
    elInput.value = "";
    autosize();
    var typing = showTyping();

    invoke(text).then(function (reply) {
      removeTyping();
      var out = reply.text || "";
      addBubble("ai", out, { intent: reply.intent });
      history.push({ role: "ai", text: out });
      if (reply.transfer) addBubble("sys", "🧑‍💼 " + t("transferred"));
      if (voiceMode && out) speak(out, reply.lang);
    }).catch(function (e) {
      removeTyping();
      console.warn("[VoxOneWidget] invoke failed:", e);
      if (!netToastShown) { toast(t("netErr"), "err"); netToastShown = true; }
      addBubble("sys", "⚠ " + t("netErr"));
    }).then(function () {
      sending = false;
      elSend.disabled = false;
      elInput.focus();
    });
  }

  /* ---------- 6. 语音引擎(双引擎:真实 SenseAudio 服务端语音 + 浏览器兜底)----
   *  · serverVoice(端点已接入)→ TTS 走 /api/agent-gateway/tts 播放真实合成音频;
   *                              ASR 走 MediaRecorder 录音 + 语音活动检测(VAD)自动断句
   *                              → /api/agent-gateway/asr 真实转写。
   *  · 否则 → 浏览器 Web Speech(SpeechRecognition 连续识别 + speechSynthesis 朗读)。
   *  两条路径都支持 barge-in(用户开口即打断 AI 播报)。
   * ------------------------------------------------------------------------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var synth = window.speechSynthesis || null;
  var rec = null, listening = false, speaking = false, voiceMode = false, micDegraded = false;
  var audioEl = null, ttsReq = 0;           // 当前真实 TTS 播放中的 <audio>;ttsReq=合成请求序号(用于打断竞态)
  var mrec = null, mstream = null, mchunks = [], recActive = false, recStarting = false;  // 服务端 ASR 录音
  var vadCtx = null, vadRaf = null, spoke = false, lastVoiceTs = 0, recStartTs = 0, recTimer = null;

  function bcp() { return LANG_BCP[CFG.lang] || "en-US"; }
  function hasRecorder() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
  function cleanTxt(s) { return String(s == null ? "" : s).replace(/\[[A-Z]{2}\]\s?/, ""); }

  function waveSpeak(on) {
    if (on) { elWave.classList.add("vxw-show", "vxw-live", "vxw-speak"); }
    else { elWave.classList.remove("vxw-speak"); if (!listening && !recActive) elWave.classList.remove("vxw-show", "vxw-live"); }
  }

  /* ---- TTS:路由到真实端点或浏览器合成 ---- */
  function speak(text, lang) {
    text = cleanTxt(text); if (!text) return;
    if (serverVoice) serverSpeak(text, lang);
    else browserSpeak(text, lang);
  }
  function serverSpeak(text, lang) {
    stopAudio();
    var myReq = ++ttsReq;               // 本次合成序号;打断或新播报会 ++ttsReq 使其失效
    speaking = true; waveSpeak(true);
    gwCall("tts", "POST", { text: text, lang: CFG.lang })
      .then(function (j) {
        if (myReq !== ttsReq) return;   // 合成返回前已被打断/顶替 → 丢弃,不再播放
        if (j && j.ok && j.audioBase64) {
          audioEl = new Audio("data:" + (j.contentType || "audio/mpeg") + ";base64," + j.audioBase64);
          audioEl.onended = audioEl.onerror = function () { audioEl = null; if (myReq === ttsReq) { speaking = false; waveSpeak(false); } };
          audioEl.play().catch(function () { audioEl = null; if (myReq === ttsReq) { speaking = false; waveSpeak(false); browserSpeak(text, lang); } });
        } else {
          // 端点不支持 TTS → 本会话降级为浏览器语音
          if (j && j.fallback) { serverVoice = false; updateVoiceBadge(); }
          speaking = false; waveSpeak(false); browserSpeak(text, lang);
        }
      })
      .catch(function () { if (myReq === ttsReq) { speaking = false; waveSpeak(false); browserSpeak(text, lang); } });
  }
  function pickVoice(target) {
    if (!synth) return null;
    var vs = synth.getVoices() || [];
    return vs.filter(function (v) { return v.lang === target; })[0] ||
           vs.filter(function (v) { return v.lang && v.lang.slice(0, 2) === target.slice(0, 2); })[0] || null;
  }
  function browserSpeak(text, lang) {
    if (!synth) return;
    var target = LANG_BCP[lang || CFG.lang] || "en-US";
    try { synth.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(cleanTxt(text));
    u.lang = target;
    var v = pickVoice(target); if (v) u.voice = v;
    u.rate = 1.03; u.pitch = 1.0;
    u.onstart = function () { speaking = true; waveSpeak(true); };
    u.onend = u.onerror = function () { speaking = false; waveSpeak(false); };
    try { synth.speak(u); } catch (e) {}
  }
  function stopAudio() { if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; } }
  function bargeIn() {
    if (!speaking) return;
    ttsReq++;                       // 使在途 TTS 合成失效(返回后不再播放)
    stopAudio();
    try { synth && synth.cancel(); } catch (e) {}
    speaking = false; waveSpeak(false);
  }

  /* ---- ASR-A:浏览器 Web Speech(连续识别,serverVoice=false 时用)---- */
  function enableMic() {
    if (!SR) { degradeMic(); return; }
    try { rec = new SR(); } catch (e) { degradeMic(); return; }
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = bcp();
    rec.onresult = function (ev) {
      var interim = "", finalTxt = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        if (r.isFinal) finalTxt += r[0].transcript; else interim += r[0].transcript;
      }
      if (interim && speaking) bargeIn();          // 全双工:用户插话即打断
      if (interim) elInput.value = interim;
      if (finalTxt.trim()) { elInput.value = ""; sendText(finalTxt.trim()); }
    };
    rec.onerror = function (e) {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { stopListen(); degradeMic(); return; }
    };
    rec.onend = function () { if (listening) { try { rec.start(); } catch (e) {} } };
    voiceMode = true;
    startListen();
  }
  function startListen() {
    if (!rec) return;
    listening = true;
    try { rec.start(); } catch (e) {}
    elMic.classList.add("vxw-on");
    elWave.classList.add("vxw-show", "vxw-live");
    toast(t("micOn"), "info");
  }
  function stopListen() {
    listening = false;
    if (rec) { try { rec.stop(); } catch (e) {} }
    elMic.classList.remove("vxw-on");
    if (!speaking) elWave.classList.remove("vxw-show", "vxw-live");
  }

  /* ---- ASR-B:MediaRecorder 录音 + VAD 自动断句 → 真实 SenseAudio ASR ---- */
  function blobToB64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onloadend = function () { resolve(String(r.result).split(",")[1] || ""); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  function stopStream() { if (mstream) { try { mstream.getTracks().forEach(function (tk) { tk.stop(); }); } catch (e) {} mstream = null; } }
  function teardownVAD() { if (vadRaf) cancelAnimationFrame(vadRaf); vadRaf = null; try { vadCtx && vadCtx.close(); } catch (e) {} vadCtx = null; }

  function startServerRec() {
    if (recStarting || recActive) return;      // 防重入:异步获取麦克风期间再次点击不重复开录
    recStarting = true;
    bargeIn();
    // 关掉 AGC(避免停顿时自动增益抬高噪声底、破坏静默断句),开回声消除/降噪
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } }).then(function (stream) {
      if (!recStarting) { try { stream.getTracks().forEach(function (tk) { tk.stop(); }); } catch (e) {} return; } // 期间已取消
      mstream = stream;
      try { mrec = new MediaRecorder(stream); }
      catch (e) { try { mrec = new MediaRecorder(stream, { mimeType: "audio/webm" }); } catch (e2) { recStarting = false; stopStream(); degradeMic(); return; } }
      mchunks = [];
      mrec.ondataavailable = function (e) { if (e.data && e.data.size) mchunks.push(e.data); };
      mrec.onstop = onServerRecStop;
      recActive = true; recStarting = false; spoke = false; lastVoiceTs = 0; recStartTs = Date.now();
      voiceMode = true;
      elMic.classList.add("vxw-on");
      elWave.classList.add("vxw-show", "vxw-live");
      toast(t("micOn"), "info");
      try { mrec.start(); } catch (e) { recActive = false; stopStream(); degradeMic(); return; }
      // 硬上限:独立于 rAF/VAD 的兜底(后台标签页 rAF 暂停、或无 AudioContext 时仍能停录)
      if (recTimer) clearTimeout(recTimer);
      recTimer = setTimeout(function () { if (recActive) stopServerRec(); }, 15000);
      setupVAD(stream);
    }).catch(function () { recStarting = false; degradeMic(); });
  }
  function stopServerRec() {
    if (!recActive) { recStarting = false; return; }
    recActive = false;
    if (recTimer) { clearTimeout(recTimer); recTimer = null; }
    teardownVAD();
    elMic.classList.remove("vxw-on");
    if (!speaking) elWave.classList.remove("vxw-show", "vxw-live");
    try { if (mrec && mrec.state === "recording") mrec.stop(); } catch (e) {}
  }
  function onServerRecStop() {
    stopStream();
    var mime = (mrec && mrec.mimeType) || "audio/webm";
    var blob = new Blob(mchunks, { type: mime });
    mchunks = [];
    if (!spoke || blob.size < 1400) { toast(t("asrEmpty"), "info"); return; }   // 没说话 / 太短 → 提示,不静默丢弃
    transcribe(blob, mime);
  }
  function setupVAD(stream) {
    try {
      vadCtx = new (window.AudioContext || window.webkitAudioContext)();
      var src = vadCtx.createMediaStreamSource(stream);
      var an = vadCtx.createAnalyser(); an.fftSize = 256; src.connect(an);
      var buf = new Uint8Array(an.frequencyBinCount);
      var floor = 0, calDone = false;          // 前 ~350ms 估计环境噪声底,阈值随之自适应
      var tick = function () {
        if (!recActive) return;
        an.getByteFrequencyData(buf);
        var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i];
        var lvl = s / buf.length;
        var now = Date.now(), elapsed = now - recStartTs;
        if (!calDone && elapsed < 350) { if (lvl < 25) floor = Math.max(floor, lvl); }  // 校准期只采低电平,避免立刻开口污染噪声底
        else calDone = true;
        var thresh = Math.max(10, floor + 8);  // 语音判定阈值 = 噪声底 + 余量(下限 10)
        if (lvl > thresh) { spoke = true; lastVoiceTs = now; if (speaking) bargeIn(); }
        // 已开口 + 尾部静默 ~1.1s 且录制 >0.8s → 自动断句;硬上限 15s(另有 recTimer 独立兜底)
        if (spoke && lastVoiceTs && now - lastVoiceTs > 1100 && elapsed > 800) { stopServerRec(); return; }
        if (elapsed > 15000) { stopServerRec(); return; }
        vadRaf = requestAnimationFrame(tick);
      };
      vadRaf = requestAnimationFrame(tick);
    } catch (e) { /* 无 AudioContext:靠 recTimer 硬上限 + 手动再次点击停止 */ }
  }
  function transcribe(blob, mime) {
    toast(t("recognizing"), "info");
    blobToB64(blob).then(function (b64) {
      return gwCall("asr", "POST", { audioBase64: b64, contentType: mime, filename: "rec.webm", lang: CFG.lang });
    }).then(function (j) {
        if (j && j.ok && j.text && j.text.trim()) { sendText(j.text.trim()); }
        else if (j && j.fallback) { serverVoice = false; updateVoiceBadge(); toast(t("voiceFallback"), "info"); }
        else { toast(t("asrEmpty"), "info"); }
      })
      .catch(function () { toast(t("netErr"), "err"); });
  }

  function degradeMic() {
    if (!micDegraded) { toast(t("noMic"), "info"); micDegraded = true; }
    elMic.disabled = true;
    elMic.style.opacity = ".4";
    elInput.focus();
  }
  function micBusy() { return listening || recActive || recStarting; }
  function stopMic() { if (recActive || recStarting) stopServerRec(); if (listening) stopListen(); }
  function toggleMic() {
    if (micDegraded) return;
    if (micBusy()) { stopMic(); return; }
    if (serverVoice && hasRecorder()) startServerRec();   // 真实 SenseAudio ASR
    else enableMic();                                     // 浏览器识别兜底
  }

  // 部分浏览器 voices 异步加载
  if (synth && typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = function () { pickVoice(bcp()); };
  }

  /* ---------- 7. 交互绑定 ---------------------------------------------- */
  function autosize() {
    elInput.style.height = "auto";
    elInput.style.height = Math.min(96, elInput.scrollHeight) + "px";
  }
  elInput.addEventListener("input", autosize);
  elInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(elInput.value); }
  });
  elSend.addEventListener("click", function () { sendText(elInput.value); });
  elMic.addEventListener("click", toggleMic);
  elBubble.addEventListener("click", openPanel);
  $("vxw-close").addEventListener("click", closePanel);

  function openPanel() {
    elPanel.classList.remove("vxw-hidden");
    elBubble.classList.add("vxw-hidden");
    if (!welcomed) {
      welcomed = true;
      // 开场欢迎语(本地写死,零网络即可展示;后续对话走网关)
      var w = welcomeText();
      addBubble("ai", w);
      history.push({ role: "ai", text: w });
    }
    setTimeout(function () { elInput.focus(); }, 240);
  }
  function closePanel() {
    elPanel.classList.add("vxw-hidden");
    elBubble.classList.remove("vxw-hidden");
    stopMic();
    bargeIn();
    voiceMode = false;   // 关闭面板即退出语音模式:下次开面板默认静默,按 🎙️ 才再朗读,避免纯文字对话被持续朗读
  }
  function togglePanel() {
    if (elPanel.classList.contains("vxw-hidden")) openPanel(); else closePanel();
  }

  /* ---------- 8. 对外 API --------------------------------------------- */
  window.VoxOneWidget = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    config: function () { return JSON.parse(JSON.stringify(CFG)); }
  };

  /* ---------- 9. 启动:探测服务端语音能力,点亮语音模式标识 ------------- */
  if (CFG.token) fetchCaps();
})();
