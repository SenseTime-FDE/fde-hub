/* ============================================================================
 *  声渡 VoxOne · 全双工语音引擎(浏览器端)
 *   · STT: Web Speech API(SpeechRecognition,连续 + 中间结果)
 *   · TTS: speechSynthesis(按语种选嗓)
 *   · 全双工:AI 说话时监听到用户开口 → 立即打断(barge-in)
 *   · 波形:AudioContext 分析真实麦克风电平,不可用时降级为模拟
 *  无麦克风/不支持时自动降级为「文本全双工」,功能不受影响。
 * ========================================================================== */
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const synth = window.speechSynthesis || null;
  const LANG_BCP = { zh: "zh-CN", yue: "zh-HK", en: "en-US", es: "es-ES", ar: "ar-SA", th: "th-TH", vi: "vi-VN", id: "id-ID", ja: "ja-JP", pt: "pt-BR" };

  class VoiceSession {
    constructor(opts = {}) {
      this.lang = opts.lang || "zh";
      this.onEvent = opts.onEvent || function () {};
      this.rec = null; this.listening = false; this.speaking = false;
      this.audioCtx = null; this.analyser = null; this.micStream = null; this._raf = null;
      this.utterQueue = [];
    }
    caps() { return { stt: !!SR, tts: !!synth }; }
    setLang(l) { this.lang = l; if (this.rec) this.rec.lang = LANG_BCP[l] || "en-US"; }

    async enableMic() {
      if (!SR) { this.onEvent("nomic", { reason: "浏览器不支持语音识别,已切换文本模式" }); return false; }
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this._setupAnalyser(this.micStream);
      } catch (e) { this.onEvent("nomic", { reason: "麦克风未授权,已切换文本模式" }); return false; }
      this.rec = new SR();
      this.rec.continuous = true; this.rec.interimResults = true; this.rec.lang = LANG_BCP[this.lang] || "en-US";
      this.rec.onresult = (ev) => {
        let interim = "", finalTxt = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i]; if (r.isFinal) finalTxt += r[0].transcript; else interim += r[0].transcript;
        }
        if (interim && this.speaking) this.bargeIn();          // 全双工:用户插话即打断
        if (interim) this.onEvent("interim", { text: interim });
        if (finalTxt.trim()) this.onEvent("user", { text: finalTxt.trim() });
      };
      this.rec.onerror = (e) => { if (e.error === "no-speech" || e.error === "aborted") return; this.onEvent("err", { error: e.error }); };
      this.rec.onend = () => { if (this.listening) { try { this.rec.start(); } catch {} } };
      return true;
    }
    startListen() { if (!this.rec) return; this.listening = true; try { this.rec.start(); } catch {} this.onEvent("listen", {}); }
    stopListen() { this.listening = false; if (this.rec) try { this.rec.stop(); } catch {} this._stopAnalyser(); }

    _setupAnalyser(stream) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const src = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser(); this.analyser.fftSize = 256;
        src.connect(this.analyser);
        const buf = new Uint8Array(this.analyser.frequencyBinCount);
        const tick = () => { this.analyser.getByteFrequencyData(buf); let s = 0; for (const v of buf) s += v; this.onEvent("level", { level: Math.min(1, s / buf.length / 90) }); this._raf = requestAnimationFrame(tick); };
        tick();
      } catch {}
    }
    _stopAnalyser() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; try { this.audioCtx && this.audioCtx.close(); } catch {} this.audioCtx = null; }

    pickVoice(bcp) {
      if (!synth) return null;
      const vs = synth.getVoices();
      return vs.find((v) => v.lang === bcp) || vs.find((v) => v.lang && v.lang.slice(0, 2) === bcp.slice(0, 2)) || null;
    }
    say(text, lang) {
      return new Promise((resolve) => {
        const L = lang || this.lang;
        if (!synth) { this.speaking = true; this.onEvent("speakstart", { text }); setTimeout(() => { this.speaking = false; this.onEvent("speakend", {}); resolve(); }, Math.min(4200, 700 + text.length * 55)); return; }
        try { synth.cancel(); } catch {}
        const u = new SpeechSynthesisUtterance(text.replace(/\[[A-Z]{2}\]\s?/, ""));
        const bcp = LANG_BCP[L] || "en-US"; u.lang = bcp; const v = this.pickVoice(bcp); if (v) u.voice = v;
        u.rate = 1.03; u.pitch = 1.0;
        u.onstart = () => { this.speaking = true; this.onEvent("speakstart", { text }); };
        u.onend = () => { this.speaking = false; this.onEvent("speakend", {}); resolve(); };
        u.onerror = () => { this.speaking = false; this.onEvent("speakend", {}); resolve(); };
        synth.speak(u);
      });
    }
    bargeIn() { if (!this.speaking) return; try { synth && synth.cancel(); } catch {} this.speaking = false; this.onEvent("bargein", {}); }
    dispose() { this.stopListen(); try { synth && synth.cancel(); } catch {} if (this.micStream) this.micStream.getTracks().forEach((t) => t.stop()); }
  }

  window.VXVoice = { VoiceSession, supported: { stt: !!SR, tts: !!synth }, LANG_BCP };
})();
