'use strict';

// 静态页面生成只需要 HTML 转义；动态站的 Cookie、表单、限流与响应逻辑不进入仓库。
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

module.exports = { esc };
