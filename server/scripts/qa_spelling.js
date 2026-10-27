#!/usr/bin/env node
/* ============================================================
 * qa_spelling.js — 排版门禁（源自国金引擎，随引擎复用一并带走）
 *
 * 门禁规则（CLAUDE.md 长期偏好，不得省略）：
 *   中文语境出现半角逗号即中止构建。
 *
 * 同时校验其它中文语境半角标点：分号、冒号、问号、叹号、圆括号。
 * 白名单（保持原样，不做全角转换）：
 *   英文专有名词内部标点 / 数字与小数点 / URL / 斜杠 / 间隔点
 *   破折号 / 省略号 / 直角引号
 * ============================================================ */
const fs = require('fs');
const path = require('path');

// 汉字区间（基本区 + 扩展 A）
const CJK_IDEO = /[一-鿿㐀-䶿]/;
// CJK 标点与全角区间
const CJK_PUNCT = /[　-〿＀-￯]/;

// 需要检查的半角标点 -> 期望的全角形式
const HALF = {
  ',': '，',
  ';': '；',
  ':': '：',
  '?': '？',
  '!': '！',
  '(': '（',
  ')': '）',
};
// 硬门禁：出现即中止（CLAUDE.md 明文规定）
const HARD = new Set([',']);

function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<!--[\s\S]*?-->/g, '\n')
    // 标签整体移除（同时移除属性内容，避免 CSS 中的半角标点误报）
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

// 该位置是否落在 URL / 域名 / 版本号 / 时间等英文技术串内部
function inTechToken(line, i) {
  const W = /[A-Za-z0-9._:/\-@#?=&%~+]/;
  let a = i;
  let b = i;
  while (a > 0 && W.test(line[a - 1])) a--;
  while (b < line.length - 1 && W.test(line[b + 1])) b++;
  const tok = line.slice(a, b + 1);
  if (/^https?:\/\//i.test(tok)) return true;
  if (/[A-Za-z0-9]\.[A-Za-z]{2,}/.test(tok)) return true; // 域名 / 文件名
  if (/^\d{1,2}:\d{2}/.test(tok)) return true; // 时间
  return false;
}

// 取左右最近的有效字符，跳过空格与标签边界符
function neighbours(line, i) {
  const SKIP = /[ \t]/;
  let p = i - 1;
  let n = i + 1;
  while (p >= 0 && SKIP.test(line[p])) p--;
  while (n < line.length && SKIP.test(line[n])) n++;
  return [p >= 0 ? line[p] : '', n < line.length ? line[n] : ''];
}

function scan(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = stripToText(raw).split('\n');
  const hits = [];
  lines.forEach((line, ln) => {
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (!(ch in HALF)) continue;
      if (inTechToken(line, i)) continue;
      const [prev, next] = neighbours(line, i);
      const chinese =
        CJK_IDEO.test(prev) || CJK_IDEO.test(next) ||
        CJK_PUNCT.test(prev) || CJK_PUNCT.test(next);
      if (!chinese) continue;
      hits.push({
        line: ln + 1,
        col: i + 1,
        ch,
        want: HALF[ch],
        hard: HARD.has(ch),
        ctx: line.slice(Math.max(0, i - 24), i + 24).split('').join(' '),
      });
    }
  });
  return hits;
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('用法：node qa_spelling.js <file.html> [...]');
  process.exit(2);
}

let hard = 0;
let soft = 0;
for (const f of targets) {
  if (!fs.existsSync(f)) {
    console.error(`找不到文件：${f}`);
    process.exit(2);
  }
  const hits = scan(f);
  if (!hits.length) {
    console.log(`[通过] ${path.basename(f)}  中文语境标点全角检查通过`);
    continue;
  }
  console.log(`\n[失败] ${path.basename(f)}  发现 ${hits.length} 处中文语境半角标点：`);
  for (const h of hits) {
    if (h.hard) hard++;
    else soft++;
    const tag = h.hard ? '[中止]' : '[警告]';
    console.log(`   ${tag} 行 ${h.line} 列 ${h.col}  "${h.ch}" 应为 "${h.want}"   ...${h.ctx}...`);
  }
}

if (hard > 0) {
  console.error(`\n构建中止：中文语境出现 ${hard} 处半角逗号（CLAUDE.md 门禁规则）。`);
  process.exit(1);
}
if (soft > 0) {
  console.error(`\n构建中止：中文语境出现 ${soft} 处其它半角标点。`);
  process.exit(1);
}
console.log('\n全部通过：中文语境标点一律全角。');
